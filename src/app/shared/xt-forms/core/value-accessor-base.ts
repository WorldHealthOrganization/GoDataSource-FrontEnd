import { ControlValueAccessor } from '@angular/forms';

export abstract class ValueAccessorBase<T> implements ControlValueAccessor {
    private innerValue: T;

    private onChangeFns = new Array<(value: T) => void>();
    private onTouchFns = new Array<() => void>();

    get value(): T {
        return this.innerValue;
    }

    set value(value: T) {
        if (this.innerValue !== value) {
            this.innerValue = value;
            this.onChangeFns.forEach(f => f(value));
        }
    }

    writeValue(value: T) {
        this.innerValue = value;
    }

    registerOnChange(fn: (value: T) => void) {
        this.onChangeFns.push(fn);
    }

    registerOnTouched(fn: () => void) {
        this.onTouchFns.push(fn);
    }

    public touch() {
        this.onTouchFns.forEach(f => f());
    }
}
