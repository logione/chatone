import { Component } from '@angular/core'
import { NgSwitch, NgSwitchDefault, NgSwitchCase } from '@angular/common'

import { EditChatComponent } from './edit-chat/edit-chat.component'

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [NgSwitch, NgSwitchDefault, NgSwitchCase, EditChatComponent]
})
export class AppComponent {
}
