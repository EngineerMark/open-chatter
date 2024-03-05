const fs = require('fs-extra');

//for extracting metadata from gguf models

//these might be wrong, open a git issue if you find a mistake
const fileTypeData = [
    {
        "name": "ALL_F32",
        "quants": 0
    },
    {
        "name": "MOSTLY_F16",
        "quants": 0
    },
    {
        "name": "MOSTLY_Q4_0",
        "quants": 4.55
    },
    {
        "name": "MOSTLY_Q4_1",
        "quants": 4.55
    },
    {
        "name": "MOSTLY_Q4_1_SOME_F16",
        "quants": 4.55
    },
    {
        "name": "MOSTLY_Q4_2",
        "quants": 4.55
    },
    {
        "name": "MOSTLY_Q4_3",
        "quants": 4.55
    },
    {
        "name": "MOSTLY_Q8_0",
        "quants": 8.5
    },
    {
        "name": "MOSTLY_Q5_0",
        "quants": 5.54
    },
    {
        "name": "MOSTLY_Q5_1",
        "quants": 5.54
    },
    {
        "name": "MOSTLY_Q2_K",
        "quants": 3.35
    },
    {
        "name": "MOSTLY_Q3_K_S",
        "quants": 3.5
    },
    {
        "name": "MOSTLY_Q3_K_M",
        "quants": 3.91
    },
    {
        "name": "MOSTLY_Q3_K_L",
        "quants": 4.27
    },
    {
        "name": "MOSTLY_Q4_K_S",
        "quants": 4.58
    },
    {
        "name": "MOSTLY_Q4_K_M",
        "quants": 4.85
    },
    {
        "name": "MOSTLY_Q5_K_S",
        "quants": 5.54
    },
    {
        "name": "MOSTLY_Q5_K_M",
        "quants": 5.69
    },
    {
        "name": "MOSTLY_Q6_K",
        "quants": 6.59
    },
    {
        "name": "MOSTLY_IQ2_XXS",
        "quants": 3.35
    },
    {
        "name": "MOSTLY_IQ2_XS",
        "quants": 3.35
    },
    {
        "name": "MOSTLY_Q2_K_S",
        "quants": 3.35
    },
    {
        "name": "MOSTLY_Q3_K_XS",
        "quants": 3.5
    },
    {
        "name": "MOSTLY_IQ3_XXS",
        "quants": 3.91
    }
]

const fileTypeIntToString = (fileType) => {
    if (fileType == null) return undefined
    return fileTypeData[fileType].name;
    // switch (fileType) {
    //     case 0:
    //         return 'ALL_F32'
    //     case 1:
    //         return 'MOSTLY_F16'
    //     case 2:
    //         return 'MOSTLY_Q4_0'
    //     case 3:
    //         return 'MOSTLY_Q4_1'
    //     case 4:
    //         return 'MOSTLY_Q4_1_SOME_F16'
    //     case 5:
    //         return 'MOSTLY_Q4_2'
    //     case 6:
    //         return 'MOSTLY_Q4_3'
    //     case 7:
    //         return 'MOSTLY_Q8_0'
    //     case 8:
    //         return 'MOSTLY_Q5_0'
    //     case 9:
    //         return 'MOSTLY_Q5_1'
    //     case 10:
    //         return 'MOSTLY_Q2_K'
    //     case 11:
    //         return 'MOSTLY_Q3_K_S'
    //     case 12:
    //         return 'MOSTLY_Q3_K_M'
    //     case 13:
    //         return 'MOSTLY_Q3_K_L'
    //     case 14:
    //         return 'MOSTLY_Q4_K_S'
    //     case 15:
    //         return 'MOSTLY_Q4_K_M'
    //     case 16:
    //         return 'MOSTLY_Q5_K_S'
    //     case 17:
    //         return 'MOSTLY_Q5_K_M'
    //     case 18:
    //         return 'MOSTLY_Q6_K'
    //     case 19:
    //         return 'MOSTLY_IQ2_XXS'
    //     case 20:
    //         return 'MOSTLY_IQ2_XS'
    //     case 21:
    //         return 'MOSTLY_Q2_K_S'
    //     case 22:
    //         return 'MOSTLY_Q3_K_XS'
    //     case 23:
    //         return 'MOSTLY_IQ3_XXS'
    //     default:
    //         return undefined
    // }
}

async function parseMetadata(file) {
    // fs.open(file, 'r', async (err, fd) => {
    //     if (err) resolve({ err });
    //     const metadata = {}

    //     const magic = await readUint32(fd);
    //     console.log(magic);
    //     return resolve({ error: null, metadata })
    // });

    try {
        const fd = await fs.open(file, 'r');
        const magic = await readUint32(fd);
        const version = await readUint32(fd);
        const tensorCount = await readVersionedSize(fd, version.value);
        const numKv = await readVersionedSize(fd, version.value);

        const metadata = {};

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
            const key = await readString(fd, version.value)
            const keyType = await readUint32(fd);

            switch (keyType.value) {
                case 0: {
                    const value = await readUint8(fd)
                    setKey(key.value, value.value)

                    break
                }
                case 1: {
                    const value = await readInt8(fd)
                    setKey(key.value, value.value)
                    break
                }
                case 2: {
                    const value = await readUint16(fd)
                    setKey(key.value, value.value)
                    break
                }
                case 3: {
                    const value = await readInt16(fd)
                    setKey(key.value, value.value)
                    break
                }
                case 4: {
                    const value = await readUint32(fd)
                    setKey(key.value, value.value)
                    break
                }
                case 5: {
                    const value = await readInt32(fd)
                    setKey(key.value, value.value)
                    break
                }
                case 6: {
                    const value = await readFloat32(fd)
                    setKey(key.value, value.value)
                    break
                }
                case 7: {
                    const value = await readBool(fd)
                    setKey(key.value, value.value)
                    break
                }
                case 8: {
                    const value = await readString(fd, version.value)
                    setKey(key.value, value.value)
                    break
                }
                case 9: {
                    const value = await readArray(fd, version.value)
                    setKey(key.value, value.value)
                    break
                }
                case 10: {
                    const value = await readUint64(fd)
                    setKey(key.value, value.value)
                    break
                }
                case 11: {
                    const value = await readInt64(fd)
                    setKey(key.value, value.value)
                    break
                }
                case 12: {
                    const value = await readFloat64(fd)
                    setKey(key.value, value.value)
                    break
                }
                default: {
                    // return resolve({ error: new Error('unknown metadata key type') })
                    // return { error: new Error('unknown metadata key type') }
                    throw new Error('unknown metadata key type');
                }
            }
        }

        return metadata;
    } catch (err) {
        console.error(err);
        return null;
    }
}

function estimateRamUsage(metadata) {
    const file_size = metadata.size;
    const context_size = metadata.metadata.llama.context_size;
    let bsz = 512;
    let fp8_cache = false;
    let bpw = fileTypeData[metadata.metadata.general.file_type].quants;

    let model_size = (file_size * bpw / 8);
    console.log(model_size);

    return 0;
}

module.exports = {
    parseMetadata,
    fileTypeIntToString,
    estimateRamUsage
}

const readNBytes = async (fd, numBytes) => {
    const buffer = Buffer.alloc(numBytes)
    const { bytesRead } = await fs.read(fd, buffer, 0, numBytes, null)
    if (bytesRead !== numBytes) {
        return { error: new Error('unexpected bytes read') }
    }
    return { bytes: buffer }
}

const readUint8 = async (fd) => {
    const bytes = await readNBytes(fd, 1)
    if (bytes.error) return bytes
    return { error: null, value: bytes.bytes.readUInt8() }
}

const readUint16 = async (fd) => {
    const bytes = await readNBytes(fd, 2)
    if (bytes.error) return bytes
    return { error: null, value: bytes.bytes.readUInt16LE() }
}

const readUint32 = async (fd) => {
    const bytes = await readNBytes(fd, 4)
    if (bytes.error) return bytes
    return { error: null, value: bytes.bytes.readUInt32LE() }
}

const readUint64 = async (fd) => {
    const bytes = await readNBytes(fd, 8)
    if (bytes.error) return bytes
    return { error: null, value: bytes.bytes.readBigUInt64LE() }
}

const readInt8 = async (fd) => {
    const bytes = await readNBytes(fd, 1)
    if (bytes.error) return bytes
    return { error: null, value: bytes.bytes.readInt8() }
}

const readInt16 = async (fd) => {
    const bytes = await readNBytes(fd, 2)
    if (bytes.error) return bytes
    return { error: null, value: bytes.bytes.readInt16LE() }
}

const readInt32 = async (fd) => {
    const bytes = await readNBytes(fd, 4)
    if (bytes.error) return bytes
    return { error: null, value: bytes.bytes.readInt32LE() }
}

const readInt64 = async (fd) => {
    const bytes = await readNBytes(fd, 8)
    if (bytes.error) return bytes
    return { error: null, value: bytes.bytes.readBigInt64LE() }
}

const readFloat32 = async (fd) => {
    const bytes = await readNBytes(fd, 4)
    if (bytes.error) return bytes
    return { error: null, value: bytes.bytes.readFloatLE() }
}

const readFloat64 = async (fd) => {
    const bytes = await readNBytes(fd, 8)
    if (bytes.error) return bytes
    return { error: null, value: bytes.bytes.readDoubleLE() }
}

const readBool = async (fd) => {
    const bytes = await readNBytes(fd, 1)
    if (bytes.error) return bytes
    return { error: null, value: bytes.bytes.readUInt8() !== 0 }
}

const readArray = async (fd, version) => {
    const arrType = await readUint32(fd)
    if (arrType.error) return arrType
    const numElts = await readVersionedSize(fd, version)
    if (numElts.error) return numElts
    const ret = []
    for (let i = 0; i < numElts.value; ++i) {
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

const readVersionedSize = async (
    fd,
    version
) => {
    let value;
    switch (version) {
        case 1: {
            const n = await readUint32(fd)
            if (n.error) return n
            value = BigInt(n.value)
            break
        }
        case 3:
        case 2: {
            const n = await readUint64(fd)
            if (n.error) return n
            value = n.value
            break
        }
    }
    return { error: null, value }
}

const readString = async (fd, version) => {
    const nBytes = await readVersionedSize(fd, version)
    if (nBytes.error) return nBytes
    const strBuffer = await readNBytes(fd, Number(nBytes.value)) // TODO: fix cast
    if (strBuffer.error) return strBuffer
    return {
        error: null,
        // eslint-disable-next-line no-control-regex
        value: strBuffer.bytes.toString().replace(/\x00/g, ''),
    }
}
