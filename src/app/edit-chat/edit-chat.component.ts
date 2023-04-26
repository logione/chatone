import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NgIf, NgFor } from '@angular/common'

import { DeviceService } from 'src/app/core/device.service'
import { Alert } from 'src/app/shared/shared'
import { IconComponent } from '../../shared/icon/icon.component'
import { BlurDirective } from '../../shared/directive/blur.directive'

import { AlertsComponent } from '../../shared/alert/alerts/alerts.component'
import { BtnCloseComponent } from '../../shared/btn-close/btn-close.component'


export interface ChatMessage {
  fromSupport: boolean
  text: string
  date: number
}

export class Chat {
  messages: ChatMessage[] = []
}

@Component({
    selector: 'doc-edit-chat',
    templateUrl: './edit-chat.component.html',
    styleUrls: ['./edit-chat.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [NgIf, BtnCloseComponent, AlertsComponent, NgFor, FormsModule,
      BlurDirective, IconComponent]
})
export class EditChatComponent {
  @ViewChild('messageInput') messageInputRef!: ElementRef
  @ViewChild('body') bodyRef!: ElementRef

  protected message = ''
  protected accessToken?: string
  
  private sentAtTranslation: string = ''
  private interval?: unknown
  protected readonly item = new Chat()

  protected get isOpen() {
    return true
  }

  protected get displayWelcomeMessage() {
    return this.item.messages.length > 0
  }

  private get messageInput(): HTMLTextAreaElement {
    return this.messageInputRef.nativeElement
  }

  private get body(): HTMLDivElement {
    return this.bodyRef.nativeElement
  }

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    protected readonly device: DeviceService) {}

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
    // TO DO
    /*let url: string
    if (this.fromSupport) {
      url = `chats/${this.item!._id}/messages`
    } else if (this.accessToken) {
      url = `chats/anonymous/${this.accessToken}/messages`
    } else {
      url = 'chats/user/messages'
    }
    this.item = await this.restService.post({ text: this.message }, url)
    this.message = ''
    this.autosizeMessageInput()
    this.messageInput.focus()
    this.scrollDown()*/
  }

  private async onUserChanged() {
    if (this.item && (!this.accessToken || this.item.messages.length === 0)) {
      this.accessToken = undefined
      this.item = undefined
      if (this.isOpen) {
        await this.initChat()
        this.changeDetectorRef.markForCheck()
      }
    }
  }

  private async onChatToggled(value: boolean) {
    if (value) {
      if (!this.item) {
        await this.initChat()
      }
      this.scrollDown()
      this.startRefreshInterval()
    } else {
      this.stopRefreshInterval()
    }
    this.changeDetectorRef.markForCheck()
  }

  private async onItemOpened(item: Chat) {
    this.stopRefreshInterval()
    this.item = item
    this.startRefreshInterval()
    this.scrollDown()
    this.changeDetectorRef.markForCheck()
  }

  private async initChat(): Promise<void> {
    if (!this.fromSupport) {
      if (this.restService.userId) {
        this.item = await this.restService.get<Chat>('chats/user')
      } else {
        try {
          const { chat, access_token } = await this.restService.get<{ chat: Chat, access_token: string }>('chats/anonymous')
          this.item = chat
          this.accessToken = access_token
        } catch (err) {
          this.chatService.failToOpen(err)
          throw err
        }
      }
    }
  }
  
  private scrollDown() {
    this.changeDetectorRef.markForCheck()
    setTimeout(() => {
      this.body.scrollTop = this.body.scrollHeight
    })
  }

  private startRefreshInterval() {
    this.interval = setInterval(async () => {
      let length = this.item?.messages.length
      let url: string
      if (this.fromSupport) {
        url = `chats/${this.item!._id}`
      } else if (this.accessToken) {
        url = `chats/anonymous/${this.accessToken}`
      } else {
        url = 'chats/user'
      }
      this.item = await this.restService.get<Chat>(url, undefined, { bypass: true })
      if (length !== this.item?.messages.length) {
        this.scrollDown()
      }
    }, 1000)
  }

  private checkBotMessagesDisplay() {
    if (this.item) {
      let hasChanged = false
        if (this.displayWelcomeMessage) {
          if (this.item.messages.length > 0) {
            this.displayWelcomeMessage = false
            hasChanged = true
          }
        } else if(this.item.messages.length === 0) {
          this.displayWelcomeMessage = true
          hasChanged = true
        }

        if (this.displaySupportNoAvailableMessage) {
          if (this.item.messages.length === 0 || this.item.messages.some(m => m.fromSupport) || this.item.messages[0].date > +new Date() - 300000) {
            this.displaySupportNoAvailableMessage = false
            hasChanged = true
          }
        } else if (this.item.messages.length > 0 && !this.item.messages.some(m => m.fromSupport) && this.item.messages[0].date <= +new Date() - 300000) {
          this.displaySupportNoAvailableMessage = true
          hasChanged = true
        }

        if (this.displayWaitingMessage) {
          if (this.displaySupportNoAvailableMessage || this.item.messages.length === 0 || this.item.messages.some(m => m.fromSupport)) {
            this.displayWaitingMessage = false
            hasChanged = true
          }
        } else if (!this.displaySupportNoAvailableMessage && this.item.messages.length > 0 && !this.item.messages.some(m => m.fromSupport)) {
          this.displayWaitingMessage = true
          hasChanged = true
        }
      }
      if (hasChanged) {
        this.changeDetectorRef.markForCheck()
      }
    }
  }

  private stopRefreshInterval() {
    if (this.interval) {
      clearInterval(this.interval as any)
      this.interval = undefined
    }
  }
}