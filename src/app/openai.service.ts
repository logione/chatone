import { Injectable } from '@angular/core'
import { ChatCompletionRequestMessage, Configuration, CreateChatCompletionRequest, OpenAIApi } from 'openai'
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
    private openai?: OpenAIApi
    private chatRequest?: CreateChatCompletionRequest
    private readonly messages: ChatCompletionRequestMessage[] = []
    
    readonly messages$ = new BehaviorSubject<ChatCompletionRequestMessage[]>([])

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
        const configuration = new Configuration({ apiKey, formDataCtor: CustomFormData  })
        this.openai = new OpenAIApi(configuration)
        this.chatRequest = {
            model: 'gpt-3.5-turbo',
            messages: this.messages
        }
        localStorage.setItem('api-key', apiKey)
    }

    async transcribe(file: File): Promise<void> {
        if (this.openai) {
            try {
                const result = await this.openai.createTranscription(file, 'whisper-1')
                this.pushMessage({ content: result.data.text, role: 'assistant'})
            } catch (err: any) {
                this.handleError(err)
            }
        }
    }

    async newQuestion(question: string): Promise<void> {
        this.pushMessage({
            content: question,
            role: 'user'
        })

        if (this.openai && this.chatRequest) {
            this.chatRequest.messages = this.messages
            try {
                const result = await this.openai.createChatCompletion(this.chatRequest)
                const message = result.data.choices[0]?.message
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

    private pushMessage(message: ChatCompletionRequestMessage) {
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