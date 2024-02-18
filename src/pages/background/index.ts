import { ExtensionMessageStruct } from '@root/src/utility/data_structure';
import { GetEmptyNotePage, NoteBlockType, NotePageType, NoteParagraphType, NoteRowType } from '@root/src/utility/note_data_struct';
import { MessageSender, MessageID, StorageID, DBAction } from '@root/src/utility/static_data';
import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import Browser from 'webextension-polyfill';
import {v4 as uuidv4} from 'uuid';

reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate('pages/content/style.scss');

chrome.sidePanel
.setPanelBehavior({ openPanelOnActionClick: true })
.catch((error) => console.error(error));


Browser.runtime.onInstalled.addListener(() => {
    console.log("installed");
});

Browser.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        try {
            let message : ExtensionMessageStruct = request;
            //console.log(message);
            if (message.sender == MessageSender.Tab && message.id == MessageID.ContentPaste) 
                OnPasteContentMessage(message.body, message.source);

            if (message.sender == MessageSender.Tab && message.id == MessageID.ContentCreate) 
                OnCreateContentMessage(message.body, message.source);

            if (message.sender == MessageSender.SidePanel && message.id == MessageID.NoteUpdate) 
                OnSidePanelNoteMessage(message.body);

            if (message.sender == MessageSender.SidePanel && message.id == MessageID.NoteEnter) 
                OnSidePanelLastNote(message.body)

        } catch{

        }
    }
);

//#region Content Page
const CreateNewNotePage = function(content: string, note_size: number) {
    const s_block = GetSingleBlock(content);
    let note : NotePageType = GetEmptyNotePage();
    note._id = uuidv4();
    note.blocks = [s_block];

    note.title = "Draft #"+ (note_size + 1);
    note.date = new Date().toDateString();

    return note;
}

const OnPasteContentMessage = async function(contents: NoteRowType[], source: string) {

    console.log("OnPasteContentMessage", contents)
    let last_visit_note = await GetLastVisitedNotes();
    let local_record = await GetLocalNotes();

    let last_block_index = 0;
    
    if (last_visit_note != undefined && last_visit_note != "")
        last_block_index = local_record.findIndex(x=>x._id == last_visit_note);

    if (last_block_index < 0 && last_block_index >= local_record.length)
        last_block_index = local_record.length - 1;

    let message : ExtensionMessageStruct = { sender: MessageSender.Background, id: MessageID.ContentPaste };

    if (local_record.length <= 0) {
        OnCreateContentMessage(contents, source);
        return;
    } else {
        const s_block = GetSingleBlock("");
        s_block.row = contents;
        s_block.source = source;
        local_record[last_block_index].blocks.push(s_block);

        message.action = DBAction.Insert;
        message.body = {id: local_record[last_block_index]._id, block: s_block};
    }

    Browser.runtime.sendMessage(message);
    Browser.storage.local.set({notes: local_record});
}

const OnCreateContentMessage = async function(contents: NoteRowType[], source: string) {
    let local_record = await GetLocalNotes();

    let note : NotePageType = CreateNewNotePage("", local_record.length);
        note.blocks[0].row = contents;
        note.blocks[0].source = source;
        local_record.push(note);

    let message : ExtensionMessageStruct = { 
        sender: MessageSender.Background, 
        id: MessageID.ContentPaste,
        action: DBAction.Create,
        body: local_record
    };

    Browser.runtime.sendMessage(message);
    Browser.storage.local.set({notes: local_record});
}
//#endregion

//#region Side Panel
const OnSidePanelLastNote = async function(content: string) {
    Browser.storage.local.set({last_visit_note: content});
}

const OnSidePanelNoteMessage = async function(content: any) {
    const action : number = content.action;
    if (action == DBAction.Update)
        UpdateSidePanelNote(content.item);

    if (action == DBAction.Delete)
        DeleteSidePanelNote(content.item);
}

const UpdateSidePanelNote = async function(note_page: NotePageType) {
    let local_notes = await GetLocalNotes();
    let index = local_notes.findIndex(x=>x._id == note_page._id);

    if (index >= 0)
        local_notes[index] = note_page;
    else
        local_notes.push(note_page);

    Browser.storage.local.set({notes: local_notes}); 
}

const DeleteSidePanelNote = async function(note_id: string) {
    let local_notes = await GetLocalNotes();
    let index = local_notes.findIndex(x=>x._id == note_id);

    if (index >= 0)
        local_notes.splice(index, 1);

    Browser.storage.local.set({notes: local_notes}); 
}
//#endregion

//#region  Utility
const GetLastVisitedNotes = async function(): Promise<string> {
    let local_record = await Browser.storage.local.get(StorageID.LastVisitNote);

    if (StorageID.LastVisitNote in local_record) {
        return local_record[StorageID.LastVisitNote];
    }

    return "";
}

const GetLocalNotes = async function() {
    let local_record = await Browser.storage.local.get(StorageID.Notes);
    let notes: NotePageType[] = [];

    if (StorageID.Notes in local_record) {
        notes = local_record[StorageID.Notes];
    }

    return notes;
}

const GetSingleBlock = function(content: string) {
    let block : NoteBlockType = {
        _id: uuidv4(),
        version: 0,
        row: [GetSingleRow(content)]
    }

    return block;
}

const GetSingleRow = function(content: string) {
    let modified_paragraph : NoteParagraphType = { text: "Hello world", keyword: true, bold: true }

    let row : NoteRowType = {
        type: "paragraph",
        children: [{ text: content }]
    };

    return row;
}

//#endregions