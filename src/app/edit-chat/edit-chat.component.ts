import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NgIf, NgFor, AsyncPipe } from '@angular/common'

import { IconComponent } from '../icon/icon.component'
import { BlurDirective } from '../blur.directive'
import { OpenAIService } from '../openai.service'

@Component({
    selector: 'doc-edit-chat',
    templateUrl: './edit-chat.component.html',
    styleUrls: ['./edit-chat.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [NgIf, NgFor, FormsModule, BlurDirective, IconComponent, AsyncPipe]
})
export class EditChatComponent {
  @ViewChild('messageInput') messageInputRef!: ElementRef
  @ViewChild('body') bodyRef!: ElementRef

  protected message = ''
  protected accessToken?: string
  protected waiting = false
  
  protected get messages$() {
    return this.openAIService.messages$
  }

  protected get hasKey() {
    return this.openAIService.hasAPIKey
  }

  protected get placeholder() {
    if (this.waiting) {
      return 'Please wait...'
    }

    if (!this.hasKey) {
      return 'Please put your ChatGPT API key here.'
    }
    return 'Send a message.'
  }

  private get messageInput(): HTMLTextAreaElement {
    return this.messageInputRef.nativeElement
  }

  private get body(): HTMLDivElement {
    return this.bodyRef.nativeElement
  }

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly openAIService: OpenAIService) {}

  protected autosizeMessageInput(): void {
    this.messageInput.style.height = '0px'
    if (this.message.length > 0) {
      this.messageInput.style.height = `${this.messageInput.scrollHeight + 2}px`
    }
  }

  protected textareaKeypress(event: KeyboardEvent): boolean {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (this.message.trim().length > 0) {
        this.sendMessage()
      }
      return false
    }
    return true
  }

  protected async sendMessage(): Promise<void> {
    if (this.hasKey) {
      this.waiting = true
      const promise = this.openAIService.newQuestion(this.message)
      this.message = ''
      this.autosizeMessageInput()
      this.scrollDown()
      await promise
      this.waiting = false
      this.scrollDown()
    } else {
      this.openAIService.setAPIKey(this.message)
      this.message = ''
      this.autosizeMessageInput()
    }
    setTimeout(() => this.messageInput.focus(), 0)
  }
  
  private scrollDown() {
    this.changeDetectorRef.markForCheck()
    setTimeout(() => {
      this.body.scrollTop = this.body.scrollHeight
    })
  }
}