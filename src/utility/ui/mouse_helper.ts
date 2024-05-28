import { EventID } from "@src/utility/static_data";
import EventSystem from "@src/utility/EventSystem";
import { Vector2 } from "@src/utility/VectorMath";

export class MouseHelper {
    static x: number = 0;
    static y: number = 0;
    private _event_system : EventSystem;
    private _common_event_tick: boolean = false;

    private _mouse_down: (event: MouseEvent) => void;
    private _mouse_up: (event: MouseEvent) => void;
    private _mouse_move: (event: MouseEvent) => void;



    constructor() {
        this._event_system = new EventSystem();
        this._mouse_down = this.on_mouse_down.bind(this);
        this._mouse_move = this.on_mouse_move.bind(this);
        this._mouse_up = this.on_mouse_up.bind(this);

        window.addEventListener("mousedown", this._mouse_down);
        window.addEventListener("mouseup", this._mouse_up);
        window.addEventListener("mousemove", this._mouse_move);

        window.addEventListener("wheel", this.on_common_event.bind(this));
        window.addEventListener("scroll", this.on_common_event.bind(this));
        window.addEventListener("resize", this.on_common_event.bind(this));

        window.addEventListener("paste", this.on_paste_event.bind(this));
    }

    public register_mouse_down(callback: (pos: Vector2) => void) {
        this._event_system.ListenToEvent(EventID.MouseDown, callback);
    }

    public register_mouse_up(callback: (pos: Vector2) => void) {
        this._event_system.ListenToEvent(EventID.MouseUp, callback);
    }

    public register_changes(callback: () => void) {
        this._event_system.ListenToEvent(EventID.PageChange, callback);
    }

    public register_paste(callback: (image: Blob) => void) {
        this._event_system.ListenToEvent(EventID.Paste, callback);
    }

    public dispose() {
        window.removeEventListener("mousedown", this._mouse_down);
        window.removeEventListener("mouseup", this._mouse_up);
        window.removeEventListener("mousemove", this._mouse_move);

        document.removeEventListener("wheel", this.on_common_event);
        document.removeEventListener("scroll", this.on_common_event);  
        document.removeEventListener("resize", this.on_common_event);
        document.removeEventListener("paste", this.on_paste_event);
    }

    private on_mouse_down(event: MouseEvent) {
        this.on_mouse_move(event);
        this._event_system.Notify(EventID.MouseDown, new Vector2(event.clientX, event.clientY));
    }

    private on_mouse_up(event: MouseEvent) {
        this.on_mouse_move(event);
        this._event_system.Notify(EventID.MouseUp, new Vector2(event.clientX, event.clientY));
    }

    private on_common_event() {
        if (this._common_event_tick) return;
        this._common_event_tick = true;

        window.requestAnimationFrame(() => {
            this._common_event_tick = false;
            this._event_system.Notify(EventID.PageChange, new Vector2(MouseHelper.x, MouseHelper.y));
        });
    }

    private async on_paste_event() {
        const clipboardContents = await navigator.clipboard.read();
            
        for (const clipboardItem of clipboardContents) {
            const imageTypes = clipboardItem.types.filter(type => type.startsWith('image/'))
            for (const imageType of imageTypes) {
                const blob = await clipboardItem.getType(imageType);
                this._event_system.Notify(EventID.Paste, blob); 
            }
        }
    }

    private on_mouse_move(event: MouseEvent) {
        MouseHelper.x = event.clientX;
        MouseHelper.y = event.clientY;
    }

    
}