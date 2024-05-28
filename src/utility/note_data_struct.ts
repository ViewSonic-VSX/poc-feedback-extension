import {v4 as uuidv4} from 'uuid';
import { P } from 'vitest/dist/reporters-OH1c16Kq';
import { ChirpAIQuizType } from './static_data_type';

export const GetEmptyNotePage = function() {
    let new_block : NotePageType = {
        _id: uuidv4(),
        title: "",
        date: "",
        blocks: [GetEmptyNoteBlock()],//Only prepare header block
        is_new_page : true,
    }
    return new_block;
}

export const GetEmptyNoteBlock = function(default_text = "") {
    let new_block : NoteBlockType = {
        _id: uuidv4(),
        version: 0,
        row: [{type: "paragraph", children: [{text: default_text}]}],//Only prepare header block
    }
    return new_block;
}

//First Layer
export type NotePageType = {
    _id: string,
    title: string,
    date: string,

    blocks : NoteBlockType[],
    is_new_page? : boolean,
}

//Second Layer
export type NoteBlockType = {
    _id: string,
    row : NoteRowType[],
    version: number,
    source?: string,
    chirp_ai_quiz_type?: ChirpAIQuizType
}

export type NoteSource = {
    sources: string[]
}

//Third Layer
export type NoteRowType = {
    type: "image" | "paragraph",
    children: NoteParagraphType[],
    url?: string
}

//Fourth Layer
export type NoteParagraphType = {
    text: string
    color?: string,
    bold?: boolean,
    italic?: boolean,
    keyword?: boolean,
    comments?: NoteCommentsType[],
    validation?: NoteValidationType,
    hover?: boolean,
    _id?: string // Use to group keyword together
}

export type NoteCommentsType = {
    _id: string,
    text: string
}

export type NoteKeywordType = {
    paragraph: NoteParagraphType,

    block_id: string,
    text: string,
}

export type NoteValidationType = {
    is_validated: boolean,
}

export const NoteSourceTexStatic = Object.freeze({
    gpt: "",
    bard: "",
    claude: ""
});



