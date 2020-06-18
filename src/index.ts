require("dotenv").config();
import express, {Request, Response} from "express";
import bodyparser from "body-parser";
import {Pool, PoolConfig} from "pg";
import decodeSmartmeBuffer, {Smartme} from "smartme-protobuf-parser";

// create connection pool
const pool = (() => {
    if (!process.env.DATABASE_URL) return undefined;
    const config : PoolConfig = {
        'connectionString': process.env.DATABASE_URL
    };
    config.ssl = {
        rejectUnauthorized: false
    } as any;
    return new Pool(config);
})()

//@ts-ignore
const debug = (v : string) => {
    if (process.env.LOG_DEBUG === "true") {
        console.log(`DEBUG - ${v}`);
    }
}
const info = (v : string) => {
    if (process.env.LOG_INFO === "true") {
        console.log(`INFO - ${v}`);
    }
}
const warn = (v : string) => {
    console.log(`WARN - ${v}`);
}

const app = express();
app.use(bodyparser.raw());
app.post("/", async (req: Request, res : Response) => {
    // get the buffer from the body
    const buf : Buffer = req.body;
    debug(`content-type header <${req.headers["content-type"]}>`);
    debug(`base64 encoded buffer <${buf.toString("base64")}>`);

    // respond
    res.status(200).send("OK").end();
    
    // decode and log
    decodeSmartmeBuffer(buf).then(samples => {
        const sample = samples[0];
        const wh = sample.getValue(Smartme.Obis.ActiveEnergyTotalImport);
        if (wh) {
            info(`Received sample from ${samples[0].deviceId} of ${wh/1000} kWh at ${samples[0].dt.toISOString()}`);
            
            // debug
            debug(`${Smartme.Obis.ActiveEnergyTotalExport} = ${sample.getValue(Smartme.Obis.ActiveEnergyTotalExport)}`);
            debug(`${Smartme.Obis.ActiveEnergyTotalImport} = ${sample.getValue(Smartme.Obis.ActiveEnergyTotalImport)}`);
            debug(`${Smartme.Obis.ActivePowerPhaseL1} = ${sample.getValue(Smartme.Obis.ActivePowerPhaseL1)}`);
            debug(`${Smartme.Obis.ActivePowerPhaseL2} = ${sample.getValue(Smartme.Obis.ActivePowerPhaseL2)}`);
            debug(`${Smartme.Obis.ActivePowerPhaseL3} = ${sample.getValue(Smartme.Obis.ActivePowerPhaseL3)}`);
            debug(`${Smartme.Obis.ActivePowerTotal} = ${sample.getValue(Smartme.Obis.ActivePowerTotal)}`);
            debug(`${Smartme.Obis.CurrentPhaseL1} = ${sample.getValue(Smartme.Obis.CurrentPhaseL1)}`);
            debug(`${Smartme.Obis.CurrentPhaseL2} = ${sample.getValue(Smartme.Obis.CurrentPhaseL2)}`);
            debug(`${Smartme.Obis.CurrentPhaseL3} = ${sample.getValue(Smartme.Obis.CurrentPhaseL3)}`);
            debug(`${Smartme.Obis.VoltagePhaseL1} = ${sample.getValue(Smartme.Obis.VoltagePhaseL1)}`);
            debug(`${Smartme.Obis.VoltagePhaseL2} = ${sample.getValue(Smartme.Obis.VoltagePhaseL2)}`);
            debug(`${Smartme.Obis.VoltagePhaseL3} = ${sample.getValue(Smartme.Obis.VoltagePhaseL3)}`);

            if (!pool) return;

            pool.query("insert into samples (dt, value) values ($1, $2)", [samples[0].dt.toISOString(), samples[0].getValue(Smartme.Obis.ActiveEnergyTotalImport)]).then(result => {
                info(`Inserted ${result.rowCount} rows in database`);
            }).catch((err : Error) => {
                warn(`Unable to insert data: ${err.message}`);
            });
            
        } else {
            warn(`Received sample WITHOUT kWh at ${samples[0].dt.toISOString()}`);
        }
    })
})

// listen when we have the message format loaded
app.listen(process.env.PORT || 8080);
info(`Started to listen on port ${process.env.PORT || 8080}`);
