import { ExtensionMessageStruct } from '@root/src/utility/data_structure';
import { GetEmptyNotePage, NoteBlockType, NotePageType, NoteParagraphType, NoteRowType } from '@root/src/utility/note_data_struct';
import { MessageSender, MessageID, StorageID, DBAction, GeneralAction, API, HttpMethod, TEST_USER_EMAIL } from '@root/src/utility/static_data';
import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import Browser from 'webextension-polyfill';
import {v4 as uuidv4} from 'uuid';
import { action } from 'webextension-polyfill';
import { Combine_API, HttpRequest } from '@root/src/utility/static_utility';
import { ChirpAIHttpData } from '@root/src/utility/static_data_type';

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
                OnPasteContentMessage(message.body, message.source, sender.tab.id);

            if (message.sender == MessageSender.Tab && message.id == MessageID.ContentCreate) 
                OnCreateContentMessage(message.body, message.source, sender.tab.id);

            if (message.sender == MessageSender.SidePanel && message.id == MessageID.NoteUpdate) 
                OnSidePanelNoteMessage(message.body);

            if (message.sender == MessageSender.SidePanel && message.id == MessageID.NoteEnter) 
                OnSidePanelLastNote(message.body)

            if (message.sender == MessageSender.SidePanel && message.id == MessageID.OpenURL) 
                OpenTabURL(message.body)
        } catch{

        }
    }
);

//#region Content Page
const CreateNewNotePage = function(content: string, note_size: number) {
    const s_block = GetSingleBlock(content);
    let note : NotePageType = GetEmptyNotePage();
    note._id = uuidv4().replaceAll('-', '').slice(0,24);
    note.blocks = [s_block];

    note.title = "Draft #"+ (note_size + 1);
    note.date = new Date().toDateString();

    return note;
}

const OnPasteContentMessage = async function(contents: any, source: string, tab_id?: number) {
    let nodes_row = contents['nodes'];
    let quiz_type = contents['chirpai_quiz_type'];

    console.log("OnPasteContentMessage", nodes_row)
    console.log("paste quiz_type", quiz_type)

    let last_visit_note = await GetLastVisitedNotes();
    let local_record = await GetLocalNotes();

    let last_block_index = 0;
    
    if (last_visit_note != undefined && last_visit_note != "")
        last_block_index = local_record.findIndex(x=>x._id == last_visit_note);

    if (last_block_index < 0 && last_block_index >= local_record.length)
        last_block_index = local_record.length - 1;

    let message : ExtensionMessageStruct = { sender: MessageSender.Background, id: MessageID.ContentPaste };

    if (local_record.length <= 0) {
        OnCreateContentMessage(nodes_row, source, tab_id);
        return;
    } else {
        const s_block = GetSingleBlock("");
        s_block.row = nodes_row;
        s_block.source = source;
        s_block.chirp_ai_quiz_type = quiz_type;
        local_record[last_block_index].blocks.push(s_block);

        message.action = DBAction.Insert;
        message.body = {id: local_record[last_block_index]._id, block: s_block};
    }

    // if (tab_id != null)
    //     Browser.tabs.sendMessage(tab_id, { sender: MessageSender.Background, id: MessageID.VSXQuizGenerate_DataCopy, action: GeneralAction.Offer});

    Browser.runtime.sendMessage(message);

    Browser.storage.local.set({notes: local_record});
}

const OnCreateContentMessage = async function(contents: any, source: string, tab_id?: number) {
    let nodes_row = contents['nodes'];
    let quiz_type = contents['chirpai_quiz_type'];

    console.log("OnCreateContentMessage", nodes_row)
    console.log("create quiz_type", quiz_type)

    let local_record = await GetLocalNotes();

    let note : NotePageType = CreateNewNotePage("", local_record.length);
        note.blocks[0].row = nodes_row;
        note.blocks[0].source = source;
        note.blocks[0].chirp_ai_quiz_type = quiz_type;
        local_record.push(note);

    let message : ExtensionMessageStruct = { 
        sender: MessageSender.Background, 
        id: MessageID.ContentPaste,
        action: DBAction.Create,
        body: local_record
    };

    Browser.runtime.sendMessage(message);
    Browser.storage.local.set({notes: local_record});

    let fetch_url = Combine_API(API.VSX_InsertBlock);
    await ExecFetch(fetch_url, HttpMethod.POST, note);
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

    let fetch_url = Combine_API(API.VSX_UpdateBlock);
    ExecFetch(fetch_url, HttpMethod.PUT, note_page);
}

const DeleteSidePanelNote = async function(note_id: string) {
    let local_notes = await GetLocalNotes();
    let index = local_notes.findIndex(x=>x._id == note_id);

    if (index >= 0)
        local_notes.splice(index, 1);

    Browser.storage.local.set({notes: local_notes}); 

    let fetch_url = Combine_API(API.VSX_DeleteBlock);
    HttpRequest(fetch_url, HttpMethod.DELETE, {id: note_id});
}

const OpenTabURL = function(url: string) {
    console.log(url)
    chrome.tabs.create({ url: url });
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
        _id: uuidv4().replaceAll('-', '').slice(0,24),
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

//#region HTTP
const ExecFetch = async function(url: string, method: HttpMethod, data?: any) {
    if (method == HttpMethod.GET) {
        return HttpRequest(url, method);
    }

    let email_account: string = TEST_USER_EMAIL;
    let email_dict = await Browser.storage.local.get(StorageID.Email);
    
    if (StorageID.Email in email_dict) {
        email_account = (email_dict[StorageID.Email])
    }

    const http_data: ChirpAIHttpData = {
        email: email_account,
        data: data
    }

    return HttpRequest(url, method, http_data);
}
//#endregion