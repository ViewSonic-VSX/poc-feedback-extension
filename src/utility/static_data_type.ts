export interface UserInfo {
    id: string,
    name: string,
    email ?: string,
}


export interface ChirpAIQuizType {
    quiz_id?: string,
    standard?: string,
    grade?: string,
    bloom_level: string,
    image_url: string,
    subject: string,
    topics: string[],
    country: string,
    key_stage?: string
}

export interface ChirpAIHttpData {
    email: string,
    data: any
}