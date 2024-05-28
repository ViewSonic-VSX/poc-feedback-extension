import { useState } from "react";
import { useUserInfoStore } from "../user_zustand";
import { Is_Email } from "@root/src/utility/static_utility";
import { Fragment } from "react";
import StorageModel from "../storge_model";
import { useEffect } from "react";

export const LoginModal = function({storage} : {storage: StorageModel}) {
    let userInfoStore = useUserInfoStore();
    let email = userInfoStore.email;
    let is_open = useUserInfoStore(s => s.email_modal_open);

    console.log(email)
    if (email == undefined) email = '';

    let [stateEmail, setStateEmail] = useState<string>('');

    useEffect(() => {
        setStateEmail(email);
    }, [email]);

    const close_modal = function() {
        let login_modal_dom = document.querySelector('.login_modal');
        login_modal_dom.classList.remove('is-active');
        userInfoStore.open_email_modal(false);
    }
    
    const confirm_button = function() {
        if (!Is_Email(stateEmail)) {
            if (stateEmail == '')
                setStateEmail(' '); //Force it wrong
            return;
        };

        close_modal();
        storage.set_email(stateEmail);
    }

    const show_email_error = function() {
        if (Is_Email(stateEmail) || stateEmail == '') return <Fragment></Fragment>;

        return <p className="error">Email format is incorrect</p>
    }

    let is_active_classname = (is_open) ? 'login_modal modal is-active' : 'login_modal modal'; 

    return (
        <div className={is_active_classname}>
            <div className="modal-background"></div>
            <div className="modal-content">
                <div className="field">
                    <h2>Email</h2>
                    {show_email_error()}
                    <p className="control has-icons-left has-icons-right">
                        <input className="input" type="email" placeholder="Enter your email address" value={stateEmail} onChange={(e) => {
                            setStateEmail(e.target.value)
                        }}  />
                    </p>
                </div>

                <button className="button is-fullwidth" onClick={confirm_button}>Confirm</button>
            </div>
            <button className="modal-close is-large" aria-label="close" onClick={close_modal}></button>
        </div>
    );
}