const fs = require('fs-extra');
const path = require('path');
const msgpack = require('@msgpack/msgpack');
const dataDir = path.join(__dirname, '..', 'data', fs.readJsonSync(require('path').join(__dirname, '..', 'package.json')).version);
const empDir = path.join(dataDir, 'emperors');
const statesDir = path.join(dataDir, 'states');
const { EncodeTools  } = require('@etomon/encode-tools');
const {  Record } = require('@etomon/wiki-dummy-data');
const emperors = fs.pathExistsSync(empDir) ? fs.readdirSync(empDir).map(f => path.join(empDir, f)) : [];
const states = fs.pathExistsSync(statesDir) ? fs.readdirSync(statesDir).map(f => path.join(statesDir, f)) : [];
function createDataProxy(data) {
    const dataProxy = new Proxy(data, {
        set: () => false,
        deleteProperty: () => false,
        has: function (target, prop) {
            if ((typeof(prop) !== 'number' && typeof(prop) !== 'string') && !Number.isInteger(Number(prop)))
                return void(0);

            return Number(prop) in target;
        },
        get: function (target, prop) {
            if (prop === 'length')
                return target.length;
            if ((typeof(prop) !== 'number' && typeof(prop) !== 'string') && !Number.isInteger(Number(prop)))
                return void(0);

            return (async () => {
                let filePath = target[Number(prop)];
              // filePath = filePath && filePath.replace('.text', '');
                if (!filePath || ! await fs.pathExists(`${filePath}`))
                    return void(0);

                const buf = await fs.readFile(`${filePath}`);

                const recordData = await Record.deserializeData(buf);

                return recordData;
            })();
        }
    });

    return dataProxy;
}

const mod = {
    emperors: createDataProxy(emperors),
    states: createDataProxy(states)
};

Object.freeze(mod);

module.exports = mod;
