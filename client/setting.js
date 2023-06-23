const Store =require("electron-store");
const store = new Store({
        encryptionKey:"vfehbvuiebvjbvkv@#@",
});

const getStoreValue = (key)=>{
        const value = store.get(key);
        if(value) return value || null;
};

const setStoreValue = (key,value) =>{
        store.set(key, value);
        return getStoreValue(key);
};

module.exports = {
        getStoreValue,
        setStoreValue
}

