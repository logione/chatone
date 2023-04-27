import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class AudioRecorderService {
    private mediaRecorder: MediaRecorder | undefined
    file$ = new Subject<File>()

    async start() {
        if (this.mediaRecorder) {
            this.stop()
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        this.mediaRecorder = new MediaRecorder(stream)
        const audioChunks: Blob[] = []
        this.mediaRecorder.addEventListener('dataavailable', event => {
            audioChunks.push(event.data)
        })
      
        this.mediaRecorder.addEventListener('stop', () => {
            this.file$.next(new File([new Blob(audioChunks, { type: 'audio/x-mpeg-3' })], 'record.mp3'))
        })
        this.mediaRecorder.start()
    }

    stop(): void {
        if (this.mediaRecorder) {
            this.mediaRecorder.stop()
            this.mediaRecorder = undefined
        }
    }
}
