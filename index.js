const express = require("express");
const bodyparser = require("body-parser");
const protobuf = require("protobufjs");
const path = require("path");
const Long = require("long");

const app = express();

const debug = v => {
    if (process.env.LOG_DEBUG === "true") {
        console.log(`DEBUG - ${v}`);
    }
}
const info = v => {
    if (process.env.LOG_INFO === "true") {
        console.log(`INFO - ${v}`);
    }
}

const isObis = (obis, b1, b2, b3, b4, b5, b6) => {
    return obis[0] === b1 && obis[1] === b2 && obis[2] === b3 && obis[3] === b4 && obis[4] === b5 && obis[5] === b6;
}

const decode = async (buf) => {
    try {
        const root = await protobuf.load(path.join(__dirname, "smartme.proto"));
        const msg = root.lookupType("DeviceDataArray");
        const obj = msg.decode(buf);
        info(`Received ${obj.DeviceDataItems.length} DeviceDataItems`);
        obj.DeviceDataItems.forEach((dd, ddIdx) => {
            const dt = dd.DateTime;
            const dtLong = Long.fromBits(dt.value.low, dt.value.high, dt.value.unsigned);
            const dateObj = new Date(dtLong.toNumber() / 10000); // in ticks, 10000 of a millisecond

            info(`DateTime (${ddIdx}): ${dateObj.toISOString()}`);

            dd.DeviceValues.forEach((v, vIdx) => {
                const obis = v.Obis;
                if (isObis(obis, 0x01, 0x00, 0x1f, 0x07, 0x00, 0xFF)) {
                    info(`Current Phase L1: ${v.Value}`);
                } else if (isObis(obis, 0x01, 0x00, 0x33, 0x07, 0x00, 0xFF)) {
                    info(`Current Phase L2: ${v.Value}`);
                } else if (isObis(obis, 0x01, 0x00, 0x47, 0x07, 0x00, 0xFF)) {
                    info(`Current Phase L3: ${v.Value}`);

                } else if (isObis(obis, 0x01, 0x00, 0x01, 0x08, 0x00, 0xFF)) {
                    info(`Active Energy Total Import: ${v.Value}`);

                } else if (isObis(obis, 0x01, 0x00, 0x01, 0x08, 0x01, 0xFF)) {
                    info(`Active Energy Tariff 1 Import: ${v.Value}`);

                } else if (isObis(obis, 0x01, 0x00, 0x01, 0x08, 0x02, 0xFF)) {
                    info(`Active Energy Tariff 2 Import: ${v.Value}`);
                    
                } else if (isObis(obis, 0x01, 0x00, 0x01, 0x08, 0x03, 0xFF)) {
                    info(`Active Energy Tariff 3 Import: ${v.Value}`);

                } else if (isObis(obis, 0x01, 0x00, 0x01, 0x08, 0x04, 0xFF)) {
                    info(`Active Energy Tariff 4 Import: ${v.Value}`);

                } else if (isObis(obis, 0x01, 0x00, 0x02, 0x08, 0x00, 0xFF)) {
                    info(`Active Energy Total Export: ${v.Value}`);

                } else if (isObis(obis, 0x01, 0x00, 0x10, 0x07, 0x00, 0xFF)) {
                    info(`Active Power Total (Import and Export): ${v.Value}`);

                } else if (isObis(obis, 0x01, 0x00, 0x01, 0x07, 0x00, 0xFF)) {
                    info(`Active Power Total: ${v.Value}`);

                } else if (isObis(obis, 0x01, 0x00, 0x15, 0x07, 0x00, 0xFF)) {
                    info(`Active Power Phase L1: ${v.Value}`);

                } else if (isObis(obis, 0x01, 0x00, 0x29, 0x07, 0x00, 0xFF)) {
                    info(`Active Power Phase L2: ${v.Value}`);

                } else if (isObis(obis, 0x01, 0x00, 0x3D, 0x07, 0x00, 0xFF)) {
                    info(`Active Power Phase L3: ${v.Value}`);

                } else if (isObis(obis, 0x01, 0x00, 0x20, 0x07, 0x00, 0xFF)) {
                    info(`Voltage Phase L1: ${v.Value}`);
                    
                } else if (isObis(obis, 0x01, 0x00, 0x34, 0x07, 0x00, 0xFF)) {
                    info(`Voltage Phase L2: ${v.Value}`);
                    
                } else if (isObis(obis, 0x01, 0x00, 0x48, 0x07, 0x00, 0xFF)) {
                    info(`Voltage Phase L3: ${v.Value}`);
                    
                }
            })
        })
        
        
        
    } catch (err) {
        console.log(err)
    }
}

app.use(bodyparser.raw());

app.post("/", async (req, res) => {
    debug(`Content-Type: ${req.headers["content-type"]}`);
    const buf = req.body;
    
    // decode
    decode(buf);

    // recond
    res.status(200).send("OK").end();
})

app.listen(process.env.PORT || 8080);
