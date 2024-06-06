import {Combine_Path} from './static_utility';

export const SUBJECT_LAW_LEARNING = "SUBJECT_LAW_LEARNING";
export const TEST_USER_EMAIL = "hsinpa@gmail.com";

export const CoockieTable = Object.freeze({
    Procedural_Language_Code : "procedural_language_code",
    UserID : "user_id",
});

export const LocalStorageTable = Object.freeze({
    Account : "account",
});

export const EventID = Object.freeze({
    MouseDown : "event@mouse_down",
    MouseUp : "event@mouse_up",
    Scroll : "event@scroll",
    Resize : "event@resize",
    PageChange : "event@changes",
    Paste : "event@paste",
});

export const NoteUIEventID = Object.freeze({
    // Comment
    CommentOpen : "event@comment_open",
    CommentClose : "event@comment_close",
    CommentConfirm : "event@comment_confirm",
});

export const LangaugeCode = Object.freeze({
    AutoDetect: "Autodetect",
    TraditionalChinese : "zh-hant",
    SimplifiedChinese : 'zh',
    English: "en",
    Korea: 'ko',
    Japanese: 'ja'
});

export const NoteSourceIcon = Object.freeze({
    BingAI : "texture/notes/bing-ai-icon.png",
    ChatGPT : "texture/notes/chatgpt-icon.png",
    Claude : "texture/notes/claude-ai-icon.png",
    Bard : "texture/notes/google-bard-icon.png",
});

export const API = Object.freeze({
    GetHotTopicList : "hottopics_list",
    GetHotTopicItem: "hottopics_item/{0}",
    GetNoteList: "note_list/{0}/{1}",
    GetNoteBlock: "note_block/{0}",

    PostNoteBlock: "create_or_update_note_page",

    Translation: "https://yuri-api.sytes.net/libretranslate/translate",
    Translation_Memory: 'https://api.mymemory.translated.net/get?q={source}&langpair={lang}',

    // Viewsonic
    VSX_GetNoteList: 'get_note_list/?user_id={0}&page_index={1}',
    VSX_GetNote: 'get_extension_draft_note/?note_id=={0}',

    VSX_InsertBlock: 'insert_extension_draft_note',
    VSX_UpdateBlock: 'update_extension_draft_note',
    VSX_DeleteBlock: 'delete_extension_draft_note',
});

export const Domain = Object.freeze({
    Dev : "http://localhost:8080/api/v1/poc_extension/",
    Prod : "http://digital-twin-balancer-2054458603.ap-southeast-1.elb.amazonaws.com/api/v1/poc_extension/",
});

export const MessageSender = Object.freeze({
    Tab : 0,
    SidePanel: 1,
    Background: 2
});

export const MessageID = Object.freeze({
    ContentPaste : 1,
    ContentCreate : 2,

    VSXQuizGenerate_DataCopy : 5,


    NoteUpdate: 20,
    NoteEnter: 21,

    OpenURL: 30,
});

export const StorageID = Object.freeze({
    UserInfo : "user_info",
    Notes : "notes",
    LastVisitNote : "last_visit_note",
    Email : "email",

    TranslationSource : "translation_source",
    TranslationTarget : "translation_target"

});

export const DBAction = Object.freeze({
    Create: 0,
    Insert: 1,
    Update : 2,
    Delete: 3
});

export const GeneralAction = Object.freeze({
    Offer: 0,
    Answer: 1,
});

export const Color = Object.freeze({
    DarkOrange: "#d35400",
    LightYellow: "#f1c40f",

    ShallowOrange: "#e67e22",
    ShallowGreen: "#2ecc71",
    ShallowRed: "#e74c3c",
});

export const Keys = Object.freeze({
    GooglePeopleAPIKey: "AIzaSyC5GwtznCj3jISGq9q4UwKJTXiWolS96EU",
});

export const HighlightKeyTable = Object.freeze({
    CLASS_NAME: "class_name",
    POINTER_ENTER: "pointer_enter",
    POINTER_LEAVE: "pointer_leave",

    KEYWORD: "keyword",
    VALIDATION: "validation",
    INPUT_EDITOR:'c_input_editor'
});


export const HighlightConfigTable = Object.freeze({
    "keyword": {
        "class_name": "keyword_comp",
        "pointer_enter": Color.DarkOrange,
        "pointer_leave": Color.ShallowGreen,
    },
    "validation": {
        "class_name": "validation_comp",
        "pointer_enter": Color.DarkOrange,
        "pointer_leave": Color.ShallowOrange,
    }
});

export enum HttpMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE"
}

export const ChirpAIQuizDataKey = Object.freeze({
    standard: 'data-standard',
    grade: 'data-grade',
    bloom_level: 'data-bloom-level',
    quiz_type: 'data-quiz-type',
    image_url: 'data-image-url',
    subject: 'data-subject',
    topics: 'data-topics',
    country: 'data-country',
    key_stage: 'data-key-stage'
});