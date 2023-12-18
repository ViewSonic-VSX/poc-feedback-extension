import { DBAction, MessageID, MessageSender, StorageID } from "@root/src/utility/static_data";
import Browser from "webextension-polyfill";
import { form_note_store, useNoteDictStore } from "./note_zustand";
import { NotePageType } from "@root/src/utility/note_data_struct";
import { ExtensionMessageStruct } from "@root/src/utility/data_structure";

export default class StorageModel {
    private _storage_change_event: any;
    private _message_change_event: any;

    constructor() {
        this.registerEvent();
        this.initiate();
    }

    async initiate() {
        let record = await Browser.storage.local.get(StorageID.Notes);
        
        if (StorageID.Notes in record) {
            console.log(record[StorageID.Notes]);
            this.set_notes(record[StorageID.Notes]);
        }
    }

    registerEvent() {
        this._message_change_event = this.onMessageListener.bind(this);

        Browser.runtime.onMessage.addListener(this._message_change_event);
        Browser.storage.local.onChanged.addListener(this._storage_change_event);
    }

    dispose() {
        Browser.runtime.onMessage.removeListener(this._message_change_event);
    }
    
    /**
     * Only listener to content page injection event
     * @param raw_message 
     */
    onMessageListener(raw_message: any) {
        const message : ExtensionMessageStruct = raw_message;
        console.log(message);
        
        if (message.sender == MessageSender.Background && message.id == MessageID.ContentPaste && message.action == DBAction.Create)
            this.set_notes(message.body);
    }



    save_note_to_background(note: NotePageType) {
        let messageStruct: ExtensionMessageStruct = { id: MessageID.NoteUpdate, sender: MessageSender.SidePanel,
             body: {
                action: DBAction.Update,
                item: note
            }
        };
        
        Browser.runtime.sendMessage(messageStruct);
    }

    delete_note_to_background(note_id: string) {
        let messageStruct: ExtensionMessageStruct = { id: MessageID.NoteUpdate, sender: MessageSender.SidePanel,
            body: {
               action: DBAction.Delete,
               item: note_id
           }
       };

       Browser.runtime.sendMessage(messageStruct);
    }

    content_page_create_note() {

    }

    set_notes(notes: NotePageType[]) {
        useNoteDictStore.setState(() => form_note_store(notes));
    }
}