import { EventEmitter, Output } from '@angular/core';

export abstract class DashletComponent {

    @Output() hide = new EventEmitter<void>();
    @Output() moveBefore = new EventEmitter<void>();
    @Output() moveAfter = new EventEmitter<void>();

    onHide() {
        this.hide.emit();
    }

    onMoveBefore() {
        this.moveBefore.emit();
    }

    onMoveAfter() {
        this.moveAfter.emit();
    }
}
