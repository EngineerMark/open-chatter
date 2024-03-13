const fs = require('fs-extra');

const ggufMagicNumber = Buffer.from([0x47, 0x47, 0x55, 0x46]).readInt32LE()

const isVersion = (version) => version === 1 || version === 2 || version === 3;
const isValidArchitecture = (architecture) => {
    return [
        'llama',
        'mpt',
        'gptneox',
        'gptj',
        'gpt2',
        'bloom',
        'falcon',
        'rwkv',
    ].includes(architecture)
}
const fileTypeIntToString = (fileType) => {
    if (fileType == null) return undefined
    switch (fileType) {
        case 0:
            return 'ALL_F32'
        case 1:
            return 'MOSTLY_F16'
        case 2:
            return 'MOSTLY_Q4_0'
        case 3:
            return 'MOSTLY_Q4_1'
        case 4:
            return 'MOSTLY_Q4_1_SOME_F16'
        case 5:
            return 'MOSTLY_Q4_2'
        case 6:
            return 'MOSTLY_Q4_3'
        case 7:
            return 'MOSTLY_Q8_0'
        case 8:
            return 'MOSTLY_Q5_0'
        case 9:
            return 'MOSTLY_Q5_1'
        case 10:
            return 'MOSTLY_Q2_K'
        case 11:
            return 'MOSTLY_Q3_K_S'
        case 12:
            return 'MOSTLY_Q3_K_M'
        case 13:
            return 'MOSTLY_Q3_K_L'
        case 14:
            return 'MOSTLY_Q4_K_S'
        case 15:
            return 'MOSTLY_Q4_K_M'
        case 16:
            return 'MOSTLY_Q5_K_S'
        case 17:
            return 'MOSTLY_Q5_K_M'
        case 18:
            return 'MOSTLY_Q6_K'
        case 19:
            return 'MOSTLY_IQ2_XXS'
        case 20:
            return 'MOSTLY_IQ2_XS'
        case 21:
            return 'MOSTLY_Q2_K_S'
        case 22:
            return 'MOSTLY_Q3_K_XS'
        case 23:
            return 'MOSTLY_IQ3_XXS'
        default:
            return undefined
    }
}

const getQuantizationInfo = (quantization_version) => {
    if (quantization_version == null) return undefined
    switch (quantization_version) {
        case 0:
            return { name: 'ALL_F32', bits: 32 }
        case 1:
            // return 'MOSTLY_F16'
            return { name: 'MOSTLY_F16', bits: 16 }
        case 2:
            // return 'MOSTLY_Q4_0'
            return { name: 'MOSTLY_Q4_0', bits: 4 }
        case 3:
            // return 'MOSTLY_Q4_1'
            return { name: 'MOSTLY_Q4_1', bits: 4 }
        case 4:
            // return 'MOSTLY_Q4_1_SOME_F16'
            return { name: 'MOSTLY_Q4_1_SOME_F16', bits: 4 }
        case 5:
            // return 'MOSTLY_Q4_2'
            return { name: 'MOSTLY_Q4_2', bits: 4 }
        case 6:
            // return 'MOSTLY_Q4_3'
            return { name: 'MOSTLY_Q4_3', bits: 4 }
        case 7:
            // return 'MOSTLY_Q8_0'
            return { name: 'MOSTLY_Q8_0', bits: 8 }
        case 8:
            // return 'MOSTLY_Q5_0'
            return { name: 'MOSTLY_Q5_0', bits: 5 }
        case 9:
            // return 'MOSTLY_Q5_1'
            return { name: 'MOSTLY_Q5_1', bits: 5 }
        case 10:
            // return 'MOSTLY_Q2_K'
            return { name: 'MOSTLY_Q2_K', bits: 2 }
        case 11:
            // return 'MOSTLY_Q3_K_S'
            return { name: 'MOSTLY_Q3_K_S', bits: 3 }
        case 12:
            // return 'MOSTLY_Q3_K_M'
            return { name: 'MOSTLY_Q3_K_M', bits: 3 }
        case 13:
            // return 'MOSTLY_Q3_K_L'
            return { name: 'MOSTLY_Q3_K_L', bits: 3 }
        case 14:
            // return 'MOSTLY_Q4_K_S'
            return { name: 'MOSTLY_Q4_K_S', bits: 4 }
        case 15:
            // return 'MOSTLY_Q4_K_M'
            return { name: 'MOSTLY_Q4_K_M', bits: 4 }
        case 16:
            // return 'MOSTLY_Q5_K_S'
            return { name: 'MOSTLY_Q5_K_S', bits: 5 }
        case 17:
            // return 'MOSTLY_Q5_K_M'
            return { name: 'MOSTLY_Q5_K_M', bits: 5 }
        case 18:
            // return 'MOSTLY_Q6_K'
            return { name: 'MOSTLY_Q6_K', bits: 6 }
        case 19:
            // return 'MOSTLY_IQ2_XXS'
            return { name: 'MOSTLY_IQ2_XXS', bits: 2 }
        case 20:
            // return 'MOSTLY_IQ2_XS'
            return { name: 'MOSTLY_IQ2_XS', bits: 2 }
        case 21:
            // return 'MOSTLY_Q2_K_S'
            return { name: 'MOSTLY_Q2_K_S', bits: 2 }
        case 22:
            // return 'MOSTLY_Q3_K_XS'
            return { name: 'MOSTLY_Q3_K_XS', bits: 3 }
        case 23:
            // return 'MOSTLY_IQ3_XXS'
            return { name: 'MOSTLY_IQ3_XXS', bits: 3 }
        default:
            return undefined
    }
}

async function parseGGUF(filepath) {
    //if filepath is a directory, return null
    const stats = await fs.lstat(filepath);
    if (stats.isDirectory()) {
        return null;
    }

    const metadata = await new Promise((resolve, reject) => {
        fs.open(filepath, 'r', async (err, fd) => {
            if (err) {
                reject(err);
                return;
            }

            const metadata = {};

            const magic = await readUint32(fd);
            if (magic.error) return resolve(magic);
            if (magic.value !== ggufMagicNumber) {
                return resolve({ error: new Error(`Invalid magic number: ${magic.value}`) });
            }

            const version = await readUint32(fd);
            if (version.error) return resolve(version);
            if (!isVersion(version.value)) {
                return resolve({ error: new Error(`Unsupported gguf version: ${version.value}`) });
            }

            const tensorCount = await readVersionedSize(fd, version.value);
            if (tensorCount.error) return resolve(tensorCount);

            const numKv = await readVersionedSize(fd, version.value);
            if (numKv.error) return resolve(numKv);

            const setKey = (keyName, value) => {
                const [key1, key2, key3, key4, key5] = keyName.split('.')

                if (!key2) {
                    metadata[key1] = value
                    return
                }
                if (!key3) {
                    if (!metadata[key1]) metadata[key1] = {}
                    metadata[key1][key2] = value
                    return
                }
                if (!key4) {
                    if (!metadata[key1]) metadata[key1] = {}
                    if (!metadata[key1][key2]) metadata[key1][key2] = {}
                    metadata[key1][key2][key3] = value
                    return
                }
                if (!key5) {
                    if (!metadata[key1]) metadata[key1] = {}
                    if (!metadata[key1][key2]) metadata[key1][key2] = {}
                    if (!metadata[key1][key2][key3]) metadata[key1][key2][key3] = {}
                    metadata[key1][key2][key3][key4] = value
                    return
                }
                if (!metadata[key1]) metadata[key1] = {}
                if (!metadata[key1][key2]) metadata[key1][key2] = {}
                if (!metadata[key1][key2][key3]) metadata[key1][key2][key3] = {}
                if (!metadata[key1][key2][key3][key4]) {
                    metadata[key1][key2][key3][key4] = {}
                }
                metadata[key1][key2][key3][key4][key5] = value
            }

            for (let i = 0; i < numKv.value; i++) {
                const key = await readString(fd, version.value);
                if (key.error) return resolve(key);
                const keyType = await readUint32(fd);
                if (keyType.error) return resolve(keyType);
                switch (keyType.value) {
                    case 0: {
                        const value = await readUint8(fd);
                        if (value.error) return resolve(value);
                        setKey(key.value, value.value);
                        break;
                    }
                    case 1: {
                        const value = await readInt8(fd);
                        if (value.error) return resolve(value);
                        setKey(key.value, value.value);
                        break;
                    }
                    case 2: {
                        const value = await readUint16(fd);
                        if (value.error) return resolve(value);
                        setKey(key.value, value.value);
                        break;
                    }
                    case 3: {
                        const value = await readInt16(fd);
                        if (value.error) return resolve(value);
                        setKey(key.value, value.value);
                        break;
                    }
                    case 4: {
                        const value = await readUint32(fd);
                        if (value.error) return resolve(value);
                        setKey(key.value, value.value);
                        break;
                    }
                    case 5: {
                        const value = await readInt32(fd);
                        if (value.error) return resolve(value);
                        setKey(key.value, value.value);
                        break;
                    }
                    case 6: {
                        const value = await readFloat32(fd);
                        if (value.error) return resolve(value);
                        setKey(key.value, value.value);
                        break;
                    }
                    case 7: {
                        const value = await readBool(fd);
                        if (value.error) return resolve(value);
                        setKey(key.value, value.value);
                        break;
                    }
                    case 8: {
                        const value = await readString(fd, version.value);
                        if (value.error) return resolve(value);
                        setKey(key.value, value.value);
                        break;
                    }
                    case 9: {
                        const value = await readArray(fd, version.value);
                        if (value.error) return resolve(value);
                        setKey(key.value, value.value);
                        break;
                    }
                    case 10: {
                        const value = await readUint64(fd);
                        if (value.error) return resolve(value);
                        setKey(key.value, value.value);
                        break;
                    }
                    case 11: {
                        const value = await readInt64(fd);
                        if (value.error) return resolve(value);
                        setKey(key.value, value.value);
                        break;
                    }
                    case 12: {
                        const value = await readFloat64(fd);
                        if (value.error) return resolve(value);
                        setKey(key.value, value.value);
                        break;
                    }
                    default: {
                        return resolve({ error: new Error('unknown metadata key type') });
                    }
                }
            }

            console.log('tensorCount', tensorCount.value);

            resolve({ error: null, metadata });
        });
    });

    if (metadata.error) return { error: metadata.error };

    return { metadata: metadata.metadata };
}

module.exports = {
    parseGGUF,
    getQuantizationInfo
};

function validateMetadata(metadata) {
    if (metadata.error) return { error: metadata.error };
    const arch = metadata.general.architecture;
    if (!arch) {
        throw new Error('general.architecture not found');
    }

    if (!isValidArchitecture(arch)) {
        throw new Error(`Invalid architecture: ${arch}`);
    }

    // switch (arch) {
    //     case 'llama': {
    //         const res = llamaMetadataSchema.safeParse(metadata)
    //         if (res.success === false) return { error: res.error }
    //         return { metadata: res.data }
    //     }
    //     case 'mpt': {
    //         const res = mPTMetadataSchema.safeParse(metadata)
    //         if (res.success === false) return { error: res.error }
    //         return { metadata: res.data }
    //     }
    //     case 'gptneox': {
    //         const res = gPTNeoXMetadataSchema.safeParse(metadata)
    //         if (res.success === false) return { error: res.error }
    //         return { metadata: res.data }
    //     }
    //     case 'gptj': {
    //         const res = gPTJMetadataSchema.safeParse(metadata)
    //         if (res.success === false) return { error: res.error }
    //         return { metadata: res.data }
    //     }
    //     case 'gpt2': {
    //         const res = gPT2MetadataSchema.safeParse(metadata)
    //         if (res.success === false) return { error: res.error }
    //         return { metadata: res.data }
    //     }
    //     case 'bloom': {
    //         const res = bloomMetadataSchema.safeParse(metadata)
    //         if (res.success === false) return { error: res.error }
    //         return { metadata: res.data }
    //     }
    //     case 'falcon': {
    //         const res = falconMetadataSchema.safeParse(metadata)
    //         if (res.success === false) return { error: res.error }
    //         return { metadata: res.data }
    //     }
    //     case 'rwkv': {
    //         const res = rWKVMetadataSchema.safeParse(metadata)
    //         if (res.success === false) return { error: res.error }
    //         return { metadata: res.data }
    //     }
    // }
}

async function readNBytes(fd, n) {
    const buffer = Buffer.alloc(n);
    const { bytesRead } = await fs.read(fd, buffer, 0, n, null);
    if (bytesRead !== n) {
        return { error: `Failed to read ${n} bytes from file` };
    }

    return { bytes: buffer };
}

async function readUint8(fd) {
    const bytes = await readNBytes(fd, 1);
    if (bytes.error) return bytes;
    return { error: null, value: bytes.bytes.readUInt8LE() };
}

async function readUint16(fd) {
    const bytes = await readNBytes(fd, 2);
    if (bytes.error) return bytes;
    return { error: null, value: bytes.bytes.readUInt16LE() };
}

async function readUint32(fd) {
    const bytes = await readNBytes(fd, 4);
    if (bytes.error) return bytes;
    return { error: null, value: bytes.bytes.readUInt32LE() };
}

async function readUint64(fd) {
    const bytes = await readNBytes(fd, 8);
    if (bytes.error) return bytes;
    return { error: null, value: bytes.bytes.readBigUInt64LE() };
}

async function readInt8(fd) {
    const bytes = await readNBytes(fd, 1);
    if (bytes.error) return bytes;
    return { error: null, value: bytes.bytes.readInt8() };
}

async function readInt16(fd) {
    const bytes = await readNBytes(fd, 2);
    if (bytes.error) return bytes;
    return { error: null, value: bytes.bytes.readInt16LE() };
}

async function readInt32(fd) {
    const bytes = await readNBytes(fd, 4);
    if (bytes.error) return bytes;
    return { error: null, value: bytes.bytes.readInt32LE() };
}

async function readInt64(fd) {
    const bytes = await readNBytes(fd, 8);
    if (bytes.error) return bytes;
    return { error: null, value: bytes.bytes.readBigInt64LE() };
}

async function readFloat32(fd) {
    const bytes = await readNBytes(fd, 4);
    if (bytes.error) return bytes;
    return { error: null, value: bytes.bytes.readFloatLE() };
}

async function readFloat64(fd) {
    const bytes = await readNBytes(fd, 8);
    if (bytes.error) return bytes;
    const arrayBuffer = new ArrayBuffer(8);
    const view = new DataView(arrayBuffer);
    for (let i = 0; i < 8; i++) {
        view.setUint8(i, bytes.bytes[i]);
    }
    return { error: null, value: view.getFloat64(0) };
}

async function readBool(fd) {
    const bytes = await readNBytes(fd, 1);
    if (bytes.error) return bytes;
    return { error: null, value: !!bytes.bytes.readUInt8() };
}

async function readVersionedSize(fd, version) {
    let value;
    switch (version) {
        case 1: {
            const n = await readUint32(fd);
            if (n.error) return n;
            value = BigInt(n.value);
            break;
        }
        case 2:
        case 3: {
            const n = await readUint64(fd);
            if (n.error) return n;
            value = n.value;
            break;
        }
    }
    return { error: null, value };
}

async function readString(fd, version) {
    const nBytes = await readVersionedSize(fd, version);
    if (nBytes.error) return nBytes;
    const strBuffer = await readNBytes(fd, Number(nBytes.value));
    if (strBuffer.error) return strBuffer;
    return {
        error: null,
        value: strBuffer.bytes.toString().replace(/\x00/g, '')
    }
}

async function readArray(fd, version) {
    const arrType = await readUint32(fd);
    if (arrType.error) return arrType;
    const numElts = await readVersionedSize(fd, version);
    if (numElts.error) return numElts;
    const ret = [];
    for (let i = 0; i < numElts.value; i++) {
        switch (arrType.value) {
            case 0: {
                const value = await readUint8(fd)
                if (value.error) return value
                ret.push(value.value)
                break
            }
            case 1: {
                const value = await readInt8(fd)
                if (value.error) return value
                ret.push(value.value)
                break
            }
            case 2: {
                const value = await readUint16(fd)
                if (value.error) return value
                ret.push(value.value)
                break
            }
            case 3: {
                const value = await readInt16(fd)
                if (value.error) return value
                ret.push(value.value)
                break
            }
            case 4: {
                const value = await readUint32(fd)
                if (value.error) return value
                ret.push(value.value)
                break
            }
            case 5: {
                const value = await readInt32(fd)
                if (value.error) return value
                ret.push(value.value)
                break
            }
            case 6: {
                const value = await readFloat32(fd)
                if (value.error) return value
                ret.push(value.value)
                break
            }
            case 7: {
                const value = await readBool(fd)
                if (value.error) return value
                ret.push(value.value)
                break
            }
            case 8: {
                const value = await readString(fd, version)
                if (value.error) return value
                ret.push(value.value)
                break
            }
            case 10: {
                const value = await readUint64(fd)
                if (value.error) return value
                ret.push(value.value)
                break
            }
            case 11: {
                const value = await readInt64(fd)
                if (value.error) return value
                ret.push(value.value)
                break
            }
            case 12: {
                const value = await readFloat64(fd)
                if (value.error) return value
                ret.push(value.value)
                break
            }
            default: {
                return { error: new Error('unknown metadata element key type') }
            }
        }
    }
    return { error: null, value: ret }
}