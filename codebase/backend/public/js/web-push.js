import { API, default as api } from "./module/API.js";
import { base64UrlToUint8Array } from "./module/Common.js"


HTMLElement.prototype.updateText = function (text) {
    this.innerText = text;
}
HTMLFormElement.prototype.getFormData = function () {
    let formData = new FormData(this);
    return Object.fromEntries(formData.entries())
}
class SoochakSubscribe extends HTMLElement {
    #elements = {}
    #actions = {}
    #key
    connectedCallback() {
        this.querySelectorAll("[data-value]").forEach(elm => {
            let elmName = elm.getAttribute("data-value");
            if (!(elmName in this.#elements)) {
                this.#elements[elmName] = []
            }
            this.#elements[elmName].push(elm)
        })
        this.querySelectorAll("[data-action]").forEach(btn => {
            let btnName = btn.getAttribute("data-action");
            if (!(btnName in this.#actions)) {
                this.#actions[btnName] = []
            }
            this.#actions[btnName].push(btn)
            btn.onclick = this.action.bind(this)
        })
        this.init()
    }
    async init() {
        if (!("serviceWorker" in navigator) || !("PushManager" in window))
            return this.updateValues("support", "Not Supported")
        try {
            let registration = await navigator.serviceWorker.register('/sw.js')
            if (!registration) throw new Error("Not Supported");
            await navigator.serviceWorker.ready
            this.updateValues("support", "Ready")
            this.registration = registration
            this.updateValues("permission", Notification.permission)
            await this.loadConfig()
            this.checkSubscription()
        } catch (error) {
            return this.updateValues("support", error.message)
        }
    }
    async checkSubscription() {
        let registration = this.registration || await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription({
            userVisibleOnly: true,
            applicationServerKey: base64UrlToUint8Array(this.#key)
        });
        this.updateValues("subscription", subscription ? "Subscribed" : "Not Subscribed")
        if (subscription) {
            this.activateAction("unsubscribe");
            this.deactivateAction("subscribe");
        } else {
            this.activateAction("subscribe");
            this.deactivateAction("unsubscribe");
        }
    }
    async loadConfig() {
        try {
            let resp = await api.get("/api/v1/web-push/config")
            if ("data" in resp)
                this.#key = resp.data
            else
                throw new Error(resp.message)
        } catch (error) {
            this.updateValues("support", error.message)
        }
    }
    activateAction(action) {
        if (!(action in this.#actions)) return;
        this.#actions[action].forEach(btn => {
            btn.disabled = false;
        })
    }
    deactivateAction(action) {
        if (!(action in this.#actions)) return;
        this.#actions[action].forEach(btn => {
            btn.disabled = true;
        })
    }
    updateValues(element, value) {
        if (!(element in this.#elements)) return;
        this.#elements[element].forEach(
            elm => {
                elm.updateText(value)
            }
        )
    }
    action(event) {
        let eventTarget = event.target;
        let action = eventTarget.getAttribute("data-action");
        this[action](event)
    }
    async subscribe(event) {
        try {
            if (Navigator.permission === "denied") throw new Error("Notification blocked by user");
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') throw new Error('Notification permission was not granted.');
            this.updateValues("permission", permission)
            if (!this.#key) throw new Error("Unauthorized");
            const reg = this.registration || await navigator.serviceWorker.ready;
            let subscription = await reg.pushManager.getSubscription();
            if (!subscription) {
                subscription = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: base64UrlToUint8Array(this.#key)
                });
                await api.put(`/api/v1/web-push/subscriber`, subscription);
            }
            await this.checkSubscription();
        } catch (error) {
            this.updateValues("permission", error.message)
        }
    }
    async unsubscribe(event) {
        try {
            const registration = this.registration;
            const subscription =
                await registration.pushManager.getSubscription();

            if (subscription) {
                // Ideally remove the server-side record too.
                await subscription.unsubscribe();
                await api.delete(`/api/v1/web-push/subscriber`, subscription);
            }

            await this.checkSubscription();
        } catch (error) {
            this.updateValues("support", error.message);
        }
    }
}

customElements.define(
    "soochak-subscribe",
    SoochakSubscribe,
    {
        extends: "article"
    }
)

class SoochakSender extends HTMLElement {
    #form;
    connectedCallback() {
        let frm = this.querySelector("form");
        this.#form = frm;
        frm.onsubmit = this.sendNotification.bind(this)
    }
    async sendNotification(event) {
        event.preventDefault();
        let data=this.#form.getFormData();
        let page=this.#form.getAttribute("action");
        let method=this.#form.getAttribute("method");
        let status=await api[method](page,data);
        console.log(status)
    }
}

customElements.define(
    "soochak-sender",
    SoochakSender,
    {
        extends: "article"
    }
)
// soochak-sender