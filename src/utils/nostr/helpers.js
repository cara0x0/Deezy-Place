// import { dbGetMetaEventSeen } from "../db";

export function addSorted(list, newItem, compare) {
    for (let i = 0; i < list.length; i++) {
        let item = list[i];
        if (compare(item, newItem)) {
            list.splice(i, 0, newItem);
            return;
        }
    }

    // the newer event is the oldest, add to end
    list.push(newItem);
}

export async function processMentions(event) {
    const mentionRegex = /\B@(?<p>[a-f0-9]{64})\b/g;

    var profileTagIndexMap = {};
    for (let match of event.content.matchAll(mentionRegex)) {
        let pubkey = match.groups.p;
        let idx = event.tags.findIndex(([t, v]) => t === "p" && v === pubkey);
        if (idx !== -1) {
            profileTagIndexMap[pubkey] = idx;
        } else {
            event.tags.push(await getPubKeyTagWithRelay(pubkey));
            profileTagIndexMap[pubkey] = event.tags.length - 1;
        }
    }

    event.content = event.content.replace(
        mentionRegex,
        (_, pubkey) => `#[${profileTagIndexMap[pubkey]}]`
    );

    return event;
}

// export async function getPubKeyTagWithRelay(pubkey) {
//     var base = ["p", pubkey];
//     let seenOn = await dbGetMetaEventSeen(0, pubkey);
//     if (seenOn.length) {
//         let random = seenOn[Math.floor(Math.random() * seenOn.length)];
//         base.push(random);
//     }
//     return base;
// }
