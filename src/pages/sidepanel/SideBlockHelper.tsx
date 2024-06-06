import { RenderSelectActionBar, RenderSideActionBar, RenderSourcePanel } from "@root/src/utility/ui/floating_panels/floating_interface";
import { useNoteDictStore, useNoteFocusStore } from "./note_zustand";
import { MouseHelper } from "@root/src/utility/ui/mouse_helper";
import { Combine_API } from "@root/src/utility/static_utility";
import { NoteBlockType, NotePageType, GetEmptyNoteBlock, NoteKeywordType, NoteParagraphType, NoteRowType } from "@root/src/utility/note_data_struct";
import { API, Color, HighlightConfigTable, HighlightKeyTable, NoteUIEventID } from "@root/src/utility/static_data";
import StorageModel from "./storge_model";
import {v4 as uuidv4} from 'uuid';
import { Editor } from "slate";
import { SlateUtility } from "@root/src/utility/slate_editor/slate_utility";
import trash_can_svg from '@assets/img/trash-can.svg';
import { Fragment } from "react";

export class SideBlockHelper {
    floatSourcePanel: RenderSourcePanel;
    floatActionbar: RenderSideActionBar;
    selectActionBar: RenderSelectActionBar;

    insert_dict_action: (id: string, block: NoteBlockType) => void;
    update_dict_action: (id: string, index: number, block: NoteBlockType) => void;
    delete_dict_action : (id: string, index: number) => void;

    storage: StorageModel;
    notePage: NotePageType;

    constructor(floatActionBar: RenderSideActionBar, renderSourcePanel: RenderSourcePanel, renderSelectActionBar : RenderSelectActionBar) {
        this.floatActionbar = floatActionBar;
        this.floatSourcePanel = renderSourcePanel;
        this.selectActionBar = renderSelectActionBar;

    }

    set_parameter(notePage: NotePageType, storage: StorageModel) {
        this.storage = storage;
        this.notePage = notePage;
    }

    set_callback(
                insert_dict_action: (id: string, block: NoteBlockType) => void,
                update_dict_action: (id: string, index: number, block: NoteBlockType) => void, 
                delete_dict_action : (id: string, index: number) => void   
    ) {
        this.insert_dict_action = insert_dict_action;
        this.update_dict_action = update_dict_action;
        this.delete_dict_action = delete_dict_action;

        const append_block_action = useNoteDictStore((state) => state.append_block);
    }

    get_block (block_id: string) {
        let block_index = this.notePage?.blocks.findIndex(x=>x._id == block_id);
        if (this.notePage == null || block_index == undefined || block_index < 0) return;

        return this.notePage.blocks[block_index];
    }

    change_block_value(block_id: string, operation: (block: NoteBlockType) => NoteBlockType) {
        let note_page = this.notePage;

        if (note_page == null) return;

        let block_index = note_page.blocks.findIndex(x=>x._id == block_id);
        
        if (block_index == undefined || block_index < 0) return;

        let new_block = operation(note_page.blocks[block_index]);
        new_block.version++;

        this.update_dict_action(this.notePage._id, block_index, new_block);

        //UpdateNotionBlock(test_account_id, notePage);
    }

    change_paragraph_value = function(note_block: NoteBlockType, keyword_id: string, editor: Editor, callabck: (p: NoteParagraphType) => NoteParagraphType) {
        this.change_block_value(note_block._id, (block: NoteBlockType) => {
            let delete_key_word_row = SlateUtility.paragraph_operation(note_block.row, (p) => {
    
                if (p._id == keyword_id) {
                    p = callabck(p);
                }
    
                return p;
            });
            
            if (editor != null) editor.children = delete_key_word_row;
    
            let new_block = {...block};
                new_block = {...new_block, row: delete_key_word_row}
    
            return new_block;
        });
    }

    add_new_block(row: any[]) {
        if (this.notePage == null) return;
    
        let new_block = GetEmptyNoteBlock();
        new_block.row = row;

        this.insert_dict_action(this.notePage._id, new_block);
    }

    add_new_row(content: string = '') {
        if (this.notePage == null) return;
    
        let new_block = GetEmptyNoteBlock(content);
        new_block._id = uuidv4();

        this.insert_dict_action(this.notePage._id, new_block);
    }

    add_new_image(image_url: string) {
        if (this.notePage == null) return;
    
        let new_block = GetEmptyNoteBlock();
        new_block._id = uuidv4();

        new_block.row[0].type = 'image';
        new_block.row[0].url = image_url;

        new_block.row.push({type: "paragraph", children: [{text: ''}]});

        this.insert_dict_action(this.notePage._id, new_block);

        return new_block;
    }

    insert_new_image(block_id:string, image_url: string) {
        if (this.notePage == null) return;
        
        let image_row: NoteRowType = {
            type: 'image',
            url: image_url,
            children: [{text: ''}]
        }

        this.change_block_value(block_id, (block: NoteBlockType) => {
            let new_block = {...block};
            let rows = [...new_block.row];

            rows.push(image_row);
            new_block.row = rows;

            return new_block;
        });

        return image_row;
    }
}

export const UpdateNotionBlock = function(user_id: string, note_page: NotePageType) {
    let url = Combine_API(API.PostNoteBlock);
    
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            user_id: user_id,
            note_page: note_page
        })
    });
}



const hover_keyword_tag = function(keyword_id: string, is_hover: boolean, hover_color: string) {
    let target_dom : HTMLElement = document.getElementById(keyword_id.substring(0, 5));

    if (target_dom != undefined) {
        target_dom.style.background = hover_color;
        target_dom.style.color = (is_hover) ?  "white" : "black";

        // target_dom.style.background = (is_hover) ?  Color.DarkOrange : Color.LightYellow;
        // target_dom.style.color = (is_hover) ?  "white" : "black";
    }
}

export const GenerateKeywordDOM = function(keyword: NoteKeywordType, type_id: string, delete_keyword_action: (key: string) => void) {
    return (<div className='keyword_comp' data-id={keyword.paragraph._id} key={keyword.paragraph._id}
    
    onClick={() => {
        delete_keyword_action(keyword.paragraph._id);
    }} 
    
    onPointerEnter={() => {
        hover_keyword_tag(keyword.paragraph._id, true, Color.DarkOrange);
    }}

    onPointerLeave={() => {
        hover_keyword_tag(keyword.paragraph._id, false, Color.ShallowGreen);
    }}>
        {keyword.text}
    </div> );
}

export const GenerateValidationDOM = function(
    keyword: NoteKeywordType,
    type_id: string,
    on_keyword_validate: (key: string, validate: boolean) => void,
    delete_keyword_action: (key: string) => void,
    on_ui_event: (id: string, data?: any) => void) 
{

    let has_comments = keyword.paragraph.comments != undefined && keyword.paragraph.comments.length > 0;

    return (<div className={HighlightConfigTable[type_id][HighlightKeyTable.CLASS_NAME]} key={keyword.paragraph._id} data-key={keyword.paragraph._id}
            style={
                (keyword.paragraph.validation == undefined) ? {} :
                {backgroundColor: (keyword.paragraph.validation.is_validated) ? Color.ShallowRed : Color.ShallowOrange} }
    
    onClick={(e) => {
        //delete_keyword_action(keyword._id);
    }} 

    onContextMenu={(e) => {
        //e.preventDefault();
    }}
    
    onPointerEnter={() => {
        hover_keyword_tag(keyword.paragraph._id, true, HighlightConfigTable[type_id][HighlightKeyTable.POINTER_ENTER]);
    }}

    onPointerLeave={() => {
        hover_keyword_tag(keyword.paragraph._id, false, HighlightConfigTable[type_id][HighlightKeyTable.POINTER_LEAVE]);
    }}>

    <div className="context_wrapper"><button onClick={() => delete_keyword_action(keyword.paragraph._id)}>X</button></div>

    <section>
        
        {/* This section is for validation check box */}
        {
            (() => {

                if (keyword.paragraph.validation == undefined) return (<Fragment></Fragment>);

                return (<input className="checkbox" type="checkbox" onChange={(e) => 
                    {
                        let target_dom : HTMLElement = document.querySelector(`div[data-key="${keyword.paragraph._id}"]`);
                        target_dom.style.background = (e.target.checked) ? Color.ShallowRed : Color.ShallowOrange;
        
                        on_keyword_validate(keyword.paragraph._id, e.target.checked);
                    }
                }
        
                checked={ (keyword.paragraph.validation != undefined && keyword.paragraph.validation.is_validated)}>
        
                </input>)
            }
            )()
        }

        <p data-comment={has_comments}
        onClick={() => {
            console.log(keyword);
            on_ui_event(NoteUIEventID.CommentOpen, keyword);
        }}>{keyword.text}</p>
    </section>
    </div> );
}
