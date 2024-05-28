import { DBAction, MessageID, MessageSender, StorageID } from "@root/src/utility/static_data";
import Browser from "webextension-polyfill";
import { form_note_store, useNoteDictStore, useNoteFocusStore } from "./note_zustand";
import { useUserInfoStore } from "./user_zustand";

import { NoteBlockType, NotePageType } from "@root/src/utility/note_data_struct";
import { ExtensionMessageStruct } from "@root/src/utility/data_structure";
import { UserInfo } from "@root/src/utility/static_data_type";

export default class StorageModel {
    private _storage_change_event: any;
    private _message_change_event: any;

    constructor() {
        this.registerEvent();
        this.initiate();
    }

    async initiate() {
        let record = await Browser.storage.local.get(StorageID.Notes);
        let user_info = await Browser.storage.local.get(StorageID.UserInfo);
        let email = await Browser.storage.local.get(StorageID.Email);

        if (StorageID.Notes in record) {
            this.set_notes(record[StorageID.Notes]);
        }

        if (StorageID.UserInfo in user_info) {
            console.log("User Info");
            console.log(user_info[StorageID.UserInfo]);
            this.set_user_info(user_info[StorageID.UserInfo])
        }

        if (StorageID.Email in email) {
            console.log("Email");
            console.log(email[StorageID.Email]);
            this.set_email(email[StorageID.Email])
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
        
        if (message.sender != MessageSender.Background) return;

        if (message.id == MessageID.ContentPaste && message.action == DBAction.Create)
            this.set_notes(message.body);

        if (message.id == MessageID.ContentPaste && message.action == DBAction.Insert)
            this.content_page_insert_note(message.body.id, message.body.block);
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

    content_page_insert_note(note_id: string, block: NoteBlockType) {
        useNoteDictStore.getState().append_block(note_id, block);
    }

    set_notes(notes: NotePageType[]) {
        useNoteDictStore.setState(() => form_note_store(notes));
    }

    set_focus_note(note_id: string) {
        useNoteFocusStore.getState().set_id(note_id);

        let messageStruct: ExtensionMessageStruct = { id: MessageID.NoteEnter, sender: MessageSender.SidePanel, body: note_id};
        Browser.runtime.sendMessage(messageStruct);
    }

    set_user_info(user_info: UserInfo | null) {
        useUserInfoStore.setState(() => ({user_info: user_info}) );
        
        if (user_info == null)
            Browser.storage.local.remove(StorageID.UserInfo)
        else
            Browser.storage.local.set({user_info: user_info});
    }

    set_email(email: string) {
        useUserInfoStore.setState(() => ({email: email}) );
        
        if (email == null)
            Browser.storage.local.remove(StorageID.Email)
        else
            Browser.storage.local.set({email: email});
    }
}