# protocol (v0.2.0)

컴패니언 WebSocket 프로토콜(developer.md §6.2)의 TS 타입과 런타임 검증기: `src/index.ts`.
`parseClientFrame` / `parseServerFrame`은 `{ok, value}` 또는 `{ok:false, code}`를 돌려준다. ctx의 좌표 키는 검증기가 버린다.

HTTP: `POST /v1/cars/register`(헤더 `X-Provision-Secret`) → `carToken`, `POST /v1/sessions`(Bearer) → `wsTicket`, `WS /v1/talk?ticket=`.
오디오: 바이너리 프레임, PCM s16le 24kHz mono. `reply.start.audio`가 `"none"`이면 오디오 없음(앱이 Pleos TTS로 읽음).
