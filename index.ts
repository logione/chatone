import { ChatCompletionRequestMessage, Configuration, CreateChatCompletionRequest, OpenAIApi } from 'openai'
import { createInterface } from 'readline/promises'

import { API_KEY } from './config'

const rl = createInterface({ input: process.stdin, output: process.stdout })

async function main() {
    const configuration = new Configuration({
        apiKey: API_KEY,
    })
    const openai = new OpenAIApi(configuration)
    const messages: ChatCompletionRequestMessage[] = []

    const chatRequest: CreateChatCompletionRequest = {
        model: 'gpt-3.5-turbo',
        messages
    }

    messages.push(await newQuestion('Hello, I am ChatONE, please ask me any question.\n(please enter "end" to send your question)'))
    while(true) {
        const result = await openai.createChatCompletion(chatRequest)
        const message = result.data.choices[0]?.message
        if (!message) {
            console.error('Error, no answer recieved from ChatGPT')
            throw new Error()
        }
        messages.push(message)
        messages.push(await newQuestion(message.content))
    }
}

async function newQuestion(question: string) {
    console.log("\x1b[36m", `\n${question}`)
    console.log("\x1b[37m")
    const response = await multilinesQuestion()
    return {
        content: response,
        role: "user"
    } as const
}

async function multilinesQuestion(message: string = ''): Promise<string> {
    const response = await rl.question('')
    if (response === 'end') {
        return message
    }
    message += `${response}\n`
    return multilinesQuestion(message)
}

main()
    .then(c => process.exit(0))
    .catch(e => process.exit(1))
