import { NotePageType } from "@root/src/utility/note_data_struct";
import { API } from "@root/src/utility/static_data";
import { Combine_API } from "@root/src/utility/static_utility";

export class APIFetch {
    private _domain: string;
    private _account_id: string;

    constructor(domain: string, account_data: string) {
        this._domain = domain;
        this._account_id = account_data;
    }

    //#region Blocks API
    public get_extension_block() {

    }

    public insert_extension_page(note_page: NotePageType) {

    }
    //#endregion

}