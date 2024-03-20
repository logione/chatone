import { Injectable } from '@angular/core'
import OpenAI from 'openai'
import { BehaviorSubject } from 'rxjs'

class CustomFormData extends FormData { // fixes issue with openai transcription
    getHeaders() {
        return {}
    }
}

@Injectable({
    providedIn: 'root'
})
export class OpenAIService {
    private openai?: OpenAI
    private chatRequest?: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming
    private readonly messages: OpenAI.Chat.ChatCompletionMessageParam[] = []
    
    readonly messages$ = new BehaviorSubject<OpenAI.Chat.ChatCompletionMessageParam[]>([])

    get hasAPIKey() {
        return Boolean(this.openai)
    }

    constructor() {
        const apiKey = localStorage.getItem('api-key')
        if (apiKey) {
            this.setAPIKey(apiKey)
        }
    }

    setAPIKey(apiKey: string): void {
        this.openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true   })
        this.chatRequest = {
            model: 'gpt-3.5-turbo',
            messages: this.messages
        }
        localStorage.setItem('api-key', apiKey)
    }

    async transcribe(file: File): Promise<void> {
        if (this.openai) {
            try {
                const result = await this.openai.audio.transcriptions.create({ file, model: 'whisper-1' })
                this.pushMessage({ content: result.text, role: 'assistant'})
            } catch (err: any) {
                this.handleError(err)
            }
        }
    }

    async newQuestion(question: string): Promise<void> {
        this.pushMessage({
            content: question,
            role: 'user' as any
        })

        if (this.openai && this.chatRequest) {
            this.chatRequest.messages = this.messages
            try {
                const result = await this.openai.chat.completions.create(this.chatRequest)
                const message = result.choices[0]?.message
                if (!message) {
                    console.error('Error, no answer recieved from ChatGPT')
                    throw new Error()
                }
                this.pushMessage(message)
            } catch (err: any) {
                this.handleError(err)
            }
        }
    }

    private pushMessage(message: OpenAI.Chat.ChatCompletionMessageParam) {
        this.messages.push(message)
        this.messages$.next(this.messages)
    }

    private handleError(err: Error) {
        const err2 = JSON.parse(JSON.stringify(err)) //otherwise status is undefined, don't know why...
        console.error(err2)
        if (err2?.status && err2.status === 401) {
            this.openai = undefined
            this.chatRequest = undefined
            this.messages.length = 0
            localStorage.removeItem('api-key')
        } else {
            this.pushMessage({ content: `Error: ${err?.message}`, role: 'assistant' })
        }
    }
}