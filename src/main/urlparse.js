export default function urlparse(hash) {
    const url = hash.slice(3)
    if (url == '') return '';
    else return url.split('/')
}