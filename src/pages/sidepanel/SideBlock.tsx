import '@pages/sidepanel/SideNote.scss';
import '@pages/sidepanel/SlateStyle.scss';
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import { FloatActionBarState, HighlightActionBarState, UserSSO_Struct } from '@src/utility/data_structure';
import { useEffect } from 'react';
import { GetEmptyNoteBlock, NoteBlockType, NotePageType, NoteParagraphType, NoteRowType } from '@root/src/utility/note_data_struct';
import { useNoteDictStore, useNoteFocusStore } from './note_zustand';
import { MouseHelper } from '@root/src/utility/ui/mouse_helper';
import { RenderSideActionBar, RenderSourcePanel, RenderSelectActionBar,  ShowFloatingBoard, RenderTrnaslationActionBar } from '@root/src/utility/ui/floating_panel';
import { Link, redirect, useNavigate, useParams } from 'react-router-dom';
import StorageModel from './storge_model';
import { GenerateKeywordDOM, GenerateValidationDOM, SideBlockHelper } from './SideBlockHelper';
import { BaseRange, Descendant, Editor, createEditor } from 'slate';
import { SlateUtility } from '@root/src/utility/slate_editor/slate_utility';
import { translate, upload_texture } from './block_elements/side_api';
import { BlockSlateContents } from './block_elements/SideBlockListView';
import { SideBlockTitleBar } from './block_elements/SideBlockTitleBar';
import { SelectionActionsCallback, SelectionCallbackType } from '@root/src/utility/slate_editor/slate_note_content';

let floatActionbar = new RenderSideActionBar()
let floatSourcePanel = new RenderSourcePanel()
let floatSelectBar = new RenderSelectActionBar()
let floatTranslationBar = new RenderTrnaslationActionBar()

const sideBlockHelper = new SideBlockHelper(floatActionbar, floatSourcePanel, floatSelectBar);

const SideBlock = ({storage} : {storage: StorageModel}) => {
    let { page_id } = useParams();
    const navigate = useNavigate();

    const append_block_action = useNoteDictStore((state) => state.append_block);
    const insert_block_action = useNoteDictStore((state) => state.insert_block);
    const update_block_action = useNoteDictStore((state) => state.update_block);
    const delete_block_action = useNoteDictStore((state) => state.delete_block);
    const delete_block_by_id_action = useNoteDictStore((state) => state.delete_block_by_id);
    const offset_block_action = useNoteDictStore((state) => state.offset);

    const set_page_action = useNoteDictStore((state) => state.set);
    const remove_note_action = useNoteDictStore((state) => state.remove);

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
        });

        mouse_helper.register_changes(() => {
            floatSelectBar.show(false);
            floatActionbar.show(false);
        });

        mouse_helper.register_paste(on_paste_event);

        return () => {
            floatSourcePanel.dispose();
            floatActionbar.dispose();
            floatSelectBar.dispose();
            floatTranslationBar.dispose();

            mouse_helper.dispose();
        };
    }, []);

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
        // if (state == FloatActionBarState.AI_Source) {
        //     ShowFloatingBoard(floatSourcePanel, MouseHelper.x, MouseHelper.y);
        //     floatActionbar.show(false);
        // }

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

        const new_keyword_rows = SlateUtility.create_highLight_rows(range, whole_descendents, 
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
        const texture_url = await upload_texture(image);
        if (texture_url == null) return;
        
        sideBlockHelper.add_new_image(texture_url);
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
//#endregion

return (
    <div className="preview-comp">
        <Link className='button' to="/">Back</Link>

        <SideBlockTitleBar on_title_change={on_title_change}>
            {noteFullPage.title}
        </SideBlockTitleBar>

        <BlockSlateContents note_page={noteFullPage} 
            on_keyword_validate={on_keyword_validate}
            on_keyword_delete={on_keyword_delete}
            on_selection_bar_event={on_selection_bar_event}
            on_slate_title_change={on_slate_title_change}
            on_action_bar_click={on_action_bar_click} />

        <div className='note_component_footer'>
            <button className="button is-primary is-light" onClick={() => sideBlockHelper.add_new_row()}>Add+</button>
            <button className='button is-danger is-light' onClick={on_note_delete}>x</button>
        </div>

        <div className='floating-container'>
            { floatSourcePanel.render() }
            { floatActionbar.render() }
            { floatSelectBar.render() }
            { floatTranslationBar.render() }
        </div>
    </div>
);
}

export default withErrorBoundary(withSuspense(SideBlock, <div> Loading ... </div>), <div> Error Occur </div>);