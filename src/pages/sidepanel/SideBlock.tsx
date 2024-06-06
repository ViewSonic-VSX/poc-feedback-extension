import '@pages/sidepanel/SideNote.scss';
import '@pages/sidepanel/SlateStyle.scss';
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import { FloatActionBarState, HighlightActionBarState, UserSSO_Struct } from '@src/utility/data_structure';
import { useEffect } from 'react';
import { GetEmptyNoteBlock, NoteBlockType, NoteCommentsType, NoteKeywordType, NotePageType, NoteParagraphType, NoteRowType } from '@root/src/utility/note_data_struct';
import { useNoteDictStore, useNoteFocusStore } from './note_zustand';
import { MouseHelper } from '@root/src/utility/ui/mouse_helper';
import { RenderSideActionBar, RenderSourcePanel, RenderSelectActionBar,  ShowFloatingBoard } from '@root/src/utility/ui/floating_panels/floating_interface';
import { Link, useNavigate, useParams } from 'react-router-dom';
import StorageModel from './storge_model';
import { SideBlockHelper } from './SideBlockHelper';
import { BaseEditor, Editor, createEditor } from 'slate';
import { SlateUtility } from '@root/src/utility/slate_editor/slate_utility';
import { translate, upload_texture } from './block_elements/side_api';
import { BlockSlateContents } from './block_elements/SideBlockListView';
import { SideBlockTitleBar } from './block_elements/SideBlockTitleBar';
import RenderSlateContent, { SelectionActionsCallback, SelectionCallbackType, withImages } from '@root/src/utility/slate_editor/slate_note_content';
import { LoadingScreenView, render_loading_screen } from './block_elements/loading_screen';
import { useState } from 'react';
import { RenderTrnaslationActionBar } from '@root/src/utility/ui/floating_panels/translation_panel';
import { RenderCommentBar } from '@root/src/utility/ui/floating_panels/comment_panel';
import EventSystem from '@root/src/utility/EventSystem';
import { HighlightKeyTable, NoteUIEventID } from '@root/src/utility/static_data';
import { useCommentStore } from '@root/src/utility/ui/floating_panels/comment_zustand';
import { BlockSlateContent } from './block_elements/SideBlockView';
import { HistoryEditor, withHistory } from 'slate-history';
import { ReactEditor, withReact } from 'slate-react';
import { useMemo } from 'react';

let floatActionbar = new RenderSideActionBar()
let floatSourcePanel = new RenderSourcePanel()
let floatSelectBar = new RenderSelectActionBar()
let floatTranslationBar = new RenderTrnaslationActionBar()
let floatCommentBar = new RenderCommentBar()

const sideBlockHelper = new SideBlockHelper(floatActionbar, floatSourcePanel, floatSelectBar);

interface FocusState {
    editor: Editor,
    id: string,
}

let focus_state: FocusState | null = null;

const SideBlock = ({storage} : {storage: StorageModel}) => {
    let { page_id } = useParams();
    let current_node_id  = useNoteFocusStore((state) => state.note_id);
    const navigate = useNavigate();
    const get_block_action = useNoteDictStore((state) => state.get_block);

    const append_block_action = useNoteDictStore((state) => state.append_block);
    const insert_block_action = useNoteDictStore((state) => state.insert_block);
    const update_block_action = useNoteDictStore((state) => state.update_block);
    const delete_block_action = useNoteDictStore((state) => state.delete_block);
    const delete_block_by_id_action = useNoteDictStore((state) => state.delete_block_by_id);
    const offset_block_action = useNoteDictStore((state) => state.offset);

    const set_current_comments = useCommentStore((state) => state.set_comments);

    const set_page_action = useNoteDictStore((state) => state.set);
    const remove_note_action = useNoteDictStore((state) => state.remove);
    const [loadVisibility, setLoadVisibility] = useState(false)

    const edit_box_editor = useMemo(() => withImages(withHistory(withReact(createEditor()))), []);
    let [editor_version, set_editor_version] = useState(0);
    let notes_dict = useNoteDictStore((state) => state.notes_dict);
    let noteFullPage = notes_dict[page_id];

    sideBlockHelper.set_callback(append_block_action, update_block_action, delete_block_action);
    sideBlockHelper.set_parameter(noteFullPage, storage);
    storage.save_note_to_background(noteFullPage);

    // //OnDestroy
    useEffect(() => {
        let mouse_helper = new MouseHelper();

        mouse_helper.register_mouse_down((pos) => {
            floatSourcePanel.mouse_down_event(pos);
            floatActionbar.mouse_down_event(pos);
            floatSelectBar.mouse_down_event(pos);
            floatTranslationBar.mouse_down_event(pos);
            floatCommentBar.mouse_down_event(pos);
        });

        mouse_helper.register_changes(() => {
            floatSelectBar.show(false);
            floatActionbar.show(false);
            floatSourcePanel.show(false);
        });

        mouse_helper.register_paste(on_paste_event);

        return () => {
            floatSourcePanel.dispose();
            floatActionbar.dispose();
            floatSelectBar.dispose();
            floatTranslationBar.dispose();
            floatCommentBar.dispose();

            mouse_helper.dispose();
        };
    }, []);

    useEffect(() => {
        console.log(current_node_id)
        if (page_id != current_node_id)
            navigate("/note/" + current_node_id);
    }, [current_node_id]);

//#region UI Event
    const on_slate_title_change = function(id: string, index: number, value: any[]) {

        let paragraph : NoteRowType[] = 
        value.map( x => {
            return {
                type: x.type,
                children: x.children,
                url: x?.url
            }
        });

        let concat = "";
        paragraph.forEach(x=> {
            if (x.type != 'paragraph') 
                concat += ' ';
            concat += x.children.reduce( (accumulator, currentValue) => { 
                return accumulator + currentValue.text}, "");
        }); 

        if (concat == "") {
            delete_block_by_id_action(page_id, id);
            return;
        }
        
        sideBlockHelper.change_block_value(id, (block: NoteBlockType) => {
            let new_block = {...block};
                new_block = {...new_block, row: paragraph}
            return new_block;
        });
    }

    const on_action_bar_click = function(id: string) {
        ShowFloatingBoard(floatActionbar, MouseHelper.x, MouseHelper.y);
        let block = sideBlockHelper.get_block(id);

        if (block == null) return;

        floatActionbar.set_callback(id, on_action_bar_state_click);
        floatSourcePanel.set_callback(id, (block.source == null) ? "" : block.source, on_source_link_set);
    }

    const on_action_bar_state_click = function(block_id:string, state: FloatActionBarState) {
        if (state == FloatActionBarState.AI_Source) {
            ShowFloatingBoard(floatSourcePanel, MouseHelper.x, MouseHelper.y - 100);
            floatActionbar.show(false);
        }

        if (state == FloatActionBarState.Delete) {
            delete_block_by_id_action(page_id, block_id);
        }

        if (state == FloatActionBarState.Move_Down) {
            offset_block_action(page_id, block_id, 1);
        }

        if (state == FloatActionBarState.Move_Up) {
            offset_block_action(page_id, block_id, -1);
        }

        floatActionbar.show(false);
    }

    const trigger_highlight_action = function(action_type: HighlightActionBarState, selection_struct: SelectionCallbackType ) {

        let block_index = selection_struct.block_index;
        let range = selection_struct.range;
        let whole_descendents = selection_struct.editor.children;

        let block_id = noteFullPage.blocks[block_index]._id;

        //Resume previous comments
        let comment_table = {};
        for (let row_index = 0; row_index < noteFullPage.blocks[block_index].row.length; row_index++) {
            for (let p_index = 0; p_index < noteFullPage.blocks[block_index].row[row_index].children.length; p_index++) {
                let paragraph = noteFullPage.blocks[block_index].row[row_index].children[p_index];
                comment_table[paragraph._id] = paragraph;
            }
        }

        const new_keyword_rows = SlateUtility.create_highLight_rows(range, whole_descendents, comment_table,
            (paragraph: NoteParagraphType[]) => { 
                if (action_type == HighlightActionBarState.Keyword) return paragraph;

                paragraph.forEach(x=>x.validation = {is_validated: false});

                return paragraph;
            }
        );

        if (new_keyword_rows == undefined) return undefined;

        //Insert Images if any
        let image_rows = noteFullPage.blocks[block_index].row.filter(x=>x.type == 'image');
            image_rows.forEach(x=>new_keyword_rows.push(x));


        noteFullPage.blocks[block_index].row.findIndex

        sideBlockHelper.change_block_value(block_id, (block: NoteBlockType) => {
            let new_block = {...block};

                new_block.row = new_keyword_rows
                new_block.version++;

            return new_block;
        });

        return new_keyword_rows;
    }

    const trigger_translation_action = async function(selection_type: SelectionCallbackType) {
        let selected_descendents = selection_type.fragment;
        const concat_string = SlateUtility.concat_node_row_string(selected_descendents);

        floatTranslationBar.set_callback(translate, 
            (translation_text: string) => {
                insert_block_action(page_id, selection_type.block_index + 1, GetEmptyNoteBlock(translation_text));
                floatTranslationBar.show(false);
            },
            () => {
                floatTranslationBar.show(false);
            }
        )

        const float_bar_bound = floatSelectBar.get_bound();

        floatTranslationBar.setup(concat_string);
        floatTranslationBar.set_position(
            (document.body.clientWidth - floatTranslationBar.get_bound().width) * 0.5
            , float_bar_bound.y + float_bar_bound.height
        );
    }

    const on_selection_bar_event = function(selection_callback: SelectionActionsCallback) {
        const selection : any = window.getSelection();

        if (selection.rangeCount <= 0) return;

        floatSelectBar.show(true);
        const getRange = selection.getRangeAt(0); 
        const selection_bound : DOMRect = getRange.getBoundingClientRect();
        const bar_bound = floatSelectBar.get_bound();

        let full_text : string = selection.toString();
            full_text = full_text.trim();

        if (full_text == "") {
            floatSelectBar.show(false);
            return;
        } 

        let y_offset = -90;
        let x_pos = selection_bound.left + (selection_bound.width * 0.5) - (bar_bound.width * 0.5);
        let y_pos = (selection_bound.top + y_offset);
        
        ShowFloatingBoard(floatSelectBar, x_pos, y_pos);
      
        floatSelectBar.set_callback((action_type: HighlightActionBarState) => {
            const keyword_struct = selection_callback();

            if (action_type == HighlightActionBarState.Keyword || action_type == HighlightActionBarState.Validation) {

                let high_light_children = trigger_highlight_action(action_type, keyword_struct);
    
                if (high_light_children != undefined)
                    keyword_struct.editor.children = high_light_children;    
            }

            if (action_type == HighlightActionBarState.Translation) {
                trigger_translation_action(keyword_struct);
            }

            floatSelectBar.show(false);
        });
    }

    const on_paste_event = async function(image: Blob) {       
        setLoadVisibility(true)
 
        const texture_url = await upload_texture(image);

        setLoadVisibility(false)

        if (texture_url == null) return;

        if (focus_state == null) {
            sideBlockHelper.add_new_image(texture_url);
        } else {
            let insert_row = sideBlockHelper.insert_new_image(focus_state.id, texture_url);
            let slate_children = [...focus_state.editor.children];
            slate_children.push(insert_row);

            focus_state.editor.children = slate_children;
        }
    }

    const on_source_link_set = function(id: string, link: string) {
        sideBlockHelper.change_block_value(id, (block: NoteBlockType) => {
            let new_block = {...block};
                new_block = {...new_block, source: link}

            return new_block;
        });
    }

    const on_keyword_delete = function(note_block: NoteBlockType, keyword_id: string, editor: Editor ) {
        sideBlockHelper.change_paragraph_value(note_block, keyword_id, editor, (p) => {
            if (p._id == keyword_id) {
                p._id = undefined;
                p.keyword = undefined;
            }
            return p;
        });
    }

    const on_keyword_validate = function(note_block: NoteBlockType, keyword_id: string, validate: boolean, editor: Editor ) {
        sideBlockHelper.change_paragraph_value(note_block, keyword_id, editor, (p) => {
            if (p._id == keyword_id) {
                p.validation = {is_validated: validate}
            }
            return p;
        });
    }

    const on_title_change = function(new_title: string) {
        let copy_page = {...noteFullPage}
        copy_page.title = new_title;
        set_page_action(copy_page)
    }

    const on_note_delete = function() {
        navigate("/");
        storage.delete_note_to_background(page_id);
        remove_note_action(page_id);
    }

    const on_focus_event = function(id: string, index: number, focus: boolean, editor: Editor) {
        //console.log(`id ${id}, index ${index}, focus ${focus}`)

        if (!focus && (focus_state != null && focus_state.id == id)) {
            focus_state = null;
        }

        if (focus) {
            focus_state = {id: id, editor: editor}
        }
    }

    const on_add_new_block = function() {
        let clone_editor_children = [...edit_box_editor.children];
        sideBlockHelper.add_new_block(clone_editor_children);

        // Clear content
        edit_box_editor.children = [{type: "paragraph", children: [{text: ''}]}]
        edit_box_editor.deselect();
    }

    const on_ui_event = function(id: string, data?: any) {
        switch(id) {
            case NoteUIEventID.CommentClose:{
                floatCommentBar.show(false);
            }
            break;

            case NoteUIEventID.CommentOpen:{
                if (floatCommentBar.is_show) {
                    floatCommentBar.show(false);
                    return;
                }

                let keyword: NoteKeywordType = data;
                let dom = document.querySelector(`.keyword_container [data-key="${keyword.paragraph._id}"]`);
                let dom_bound = dom.getBoundingClientRect();
                const y_offset = 30;
                let y_pos = (dom_bound.top + y_offset);
                
                set_current_comments((keyword.paragraph.comments != undefined) ? keyword.paragraph.comments : []);
                
                floatCommentBar.show(true);
                floatCommentBar.set_position(
                    (document.body.clientWidth - floatCommentBar.get_bound().width) * 0.5, y_pos
                );
                floatCommentBar.set_variable(keyword);
            }
            break;

            case NoteUIEventID.CommentConfirm: {
                let keyword: NoteKeywordType = data.keyword;
                let comments: NoteCommentsType[] = data.comments;

                let note_block = get_block_action(page_id, keyword.block_id);
                sideBlockHelper.change_paragraph_value(note_block, keyword.paragraph._id, null, (p) => {
                    p.comments = comments;
                    return p;
                });
            }
            break;
        }
    }
//#endregion
let new_block = GetEmptyNoteBlock();

return (
    <div className="preview-comp">
        <div className='note_component_footer'>
            <Link className='button' to="/">Back</Link>
            <button className='button is-danger is-light' onClick={on_note_delete}>x</button>
        </div>

        <SideBlockTitleBar on_title_change={on_title_change}>
            {noteFullPage.title}
        </SideBlockTitleBar>

        <BlockSlateContents note_page={noteFullPage} 
            focus_event={on_focus_event}
            on_keyword_validate={on_keyword_validate}
            on_keyword_delete={on_keyword_delete}
            on_selection_bar_event={on_selection_bar_event}
            on_slate_title_change={on_slate_title_change}
            on_action_bar_click={on_action_bar_click}
            on_ui_event={on_ui_event}
             />

            <div className="note-block-comp">
                <RenderSlateContent id={HighlightKeyTable.INPUT_EDITOR} default_data={[{type: "paragraph", children: [{text: ''}]}]} editor={edit_box_editor}
                index={0} version={editor_version} key={HighlightKeyTable.INPUT_EDITOR}
                readOnly={false} 
                focus_event={(id: string, index: number, is_focus: boolean, editor: Editor) => {console.log('focus_event ' + id);}}
                finish_edit_event={(id: string, index: number, value: any[]) => { if (SlateUtility.concat_node_row_string(value).length > 0) on_add_new_block();}} 
                action_bar_event={(id: string) => {console.log('action_bar_event ' + id);}}
                selection_bar_event={(selection_callback: SelectionActionsCallback) => {console.log('selection_callback ');}}
                placeholder_text="Enter your comment here . . ."></RenderSlateContent>
            </div>


        <div className='note_component_footer'>
            <button className="button is-primary is-light" onClick={() => on_add_new_block()}>Add+</button>
        </div>

        <div className='floating-container'>
            { floatSourcePanel.render() }
            { floatActionbar.render() }
            { floatSelectBar.render() }
            { floatTranslationBar.render() }
            { floatCommentBar.render(on_ui_event) }
            { render_loading_screen("Uploading . . .", loadVisibility)  }
            
        </div>
    </div>
);
}

export default withErrorBoundary(withSuspense(SideBlock, <div> Loading ... </div>), <div> Error Occur </div>);