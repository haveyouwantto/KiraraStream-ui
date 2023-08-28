import "../resources/style.css"

const { default: ApiClient } = require("./main/apiclient");

const client = new ApiClient("");
client.listAlbums();