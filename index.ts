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

    messages.push(await newQuestion('Hello, I am ChatONE, please ask me any question.\n(please end your question with "?" or press "enter" twice. You can enter "bye" to quit)'))
    while(messages.slice(-1)[0].content !== 'bye\n') {
        const result = await openai.createChatCompletion(chatRequest)
        const message = result.data.choices[0]?.message
        if (!message) {
            console.error('Error, no answer recieved from ChatGPT')
            throw new Error()
        }
        messages.push(message)
        messages.push(await newQuestion(message.content))
    }
    console.log("\x1b[36m", `\nGoodbye! Have a good day`)
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
    message += `${response}\n`
    if ((response.length === 0 || response.endsWith('?') || response === 'bye') && message.length > 3) {
        return message
    }
    return multilinesQuestion(message)
}

main()
    .then(c => process.exit(0))
    .catch(e => process.exit(1))
