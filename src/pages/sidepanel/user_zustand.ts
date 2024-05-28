import { UserInfo } from "@root/src/utility/static_data_type";
import { produce } from "immer";
import {create} from 'zustand';

type UserInfoZusStore = {
    user_info: UserInfo | null,

    email: string | null,
    email_modal_open: boolean,
    set_user: (info: UserInfo | null) => void,
    set_email: (email: string | null) => void,
    open_email_modal: (is_open: boolean) => void,

    is_login: () => boolean,
}

export const useUserInfoStore = create<UserInfoZusStore>( (set, get) => ({
    user_info: null,
    email: null,
    email_modal_open: false,

    set_user(info: UserInfo) {
        set( produce( (state : UserInfoZusStore) => {
            state.user_info = info;
        }));
    },

    set_email(email: string) {
        set( produce( (state : UserInfoZusStore) => {
            state.email = email;
        }));
    },

    open_email_modal(is_open: boolean) {
        set( produce( (state : UserInfoZusStore) => {
            state.email_modal_open = is_open;
        }));
    },

    is_login() {
        return get().user_info != null;
    }
}));

