import "../resources/style.css"
import "../resources/player.css"

const { default: ApiClient } = require("./main/apiclient");

const client = new ApiClient("");
client.listAlbums();