import { AfterContentInit, Directive, ElementRef, Input } from '@angular/core'

@Directive({
    selector: '[docBlur]',
    standalone: true
})
export class BlurDirective implements AfterContentInit {
    @Input() blurEnabled = true
    constructor(private el: ElementRef) {}

    ngAfterContentInit(): void {
        setTimeout(() => {
            if (this.blurEnabled) {
                this.el.nativeElement.blur()
            } else {
                this.el.nativeElement.focus()
            }
        }, 0)
    }
}
