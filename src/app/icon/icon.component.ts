import { Component, Input, ChangeDetectionStrategy } from '@angular/core'
import { NgIf, NgClass } from '@angular/common'

@Component({
    selector: 'doc-icon',
    templateUrl: './icon.component.html',
    styleUrls: ['./icon.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [NgIf, NgClass]
})
export class IconComponent {
  @Input() fixedWidth = true
  @Input() name!: string
  @Input() text?: string
  @Input() colored = false

  protected get classes(): string[] {
    const classes = [
      'icon',
      `icon-${this.name}`,
      this.fixedWidth ? 'icon-fw' : ''
    ]
    if (this.colored) {
      classes.push(this.name)
    }
    return classes
  }
}
