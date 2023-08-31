import "../resources/style.css"
import "../resources/player.css"
import KiraraStream from "./main/kirarastream";
import urlparse from "./main/urlparse";

const client = new KiraraStream("");

const command = urlparse(location.hash)
console.log(command)
if (command == '') {
    client.listAlbums()
} else {
    switch (command[0]) {
        case 'album':
            client.listTracks(command[1])
    }
}