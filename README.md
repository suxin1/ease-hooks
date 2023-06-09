<h2 align="center">Easy to use hooks</h2>

## Install
```bash
npm install ease-hooks
# or 
yarn add ease-hooks
```

## useCache
useCache expect 4 parameter:
1. cacheName(required): unique name for identifying data.
2. getter(required): this function expect to return a `Promise` like.
3. level: 1 for memory cache, 2 for sessionStorage, 3 for localStorage.
4. expireDays: for how many day data will be expired.

```javascript
import {useCache} from "ease-hooks";

function Component() {
    const [data, update, clear ] = useCache("CACHE_NAME", () => {
       return Promise.resolve(SomeData) 
    }, 0, 30);
    
    clear() // clear saved data, at next time it runs, data will be reloaded.
    update(data) // update saved data. 
    
    // some other code
}
```
