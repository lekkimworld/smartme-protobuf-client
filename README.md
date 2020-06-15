# smartme-protobuf-client #

https://www.any-api.com/smart_me_com/smart_me_com/docs/Definitions/SmartMeDeviceConfigurationContainer

## Example queries ##
Queries work by
1. creating a time series grouped to the required grouping with a value of 0 (named `dt_series`)
2. perform query against actual data grouping by same grouping (named `actuals`)
3. do a left join to get data from empty time series temp table if no actual data

### this month, grouped by hour ###
```
with 
dt_series as (select to_char(dt, 'YYYY-MM-DD HH24') period, 0 as value from generate_series(date_trunc('month', current_timestamp at time zone 'Europe/Copenhagen'), date_trunc('month', current_timestamp at time zone 'Europe/Copenhagen') + interval '1 month' - interval '1 day', interval '1 hour') dt)
, 
actuals as (with temp2 as (with temp1 as (select dt, value from samples where value != 0 and to_char(dt, 'YYYY') != '1970' order by dt desc) select dt, value, value-lead(value,1) over (order by dt desc) diff_value from temp1) select to_char(dt at time zone 'Europe/Copenhagen', 'YYYY-MM-DD HH24') period, sum(diff_value) as value from temp2 group by period order by period) 

select dt_series.period, case when actuals.value != 0 then actuals.value else dt_series.value end from dt_series left join actuals on dt_series.period=actuals.period;
```

### this month, grouped by day ###
```
with 
dt_series as (select to_char(dt, 'YYYY-MM-DD') period, 0 as value from generate_series(date_trunc('month', current_timestamp at time zone 'Europe/Copenhagen'), date_trunc('month', current_timestamp at time zone 'Europe/Copenhagen') + interval '1 month' - interval '1 day', interval '1 day') dt)
, 
actuals as (with temp2 as (with temp1 as (select dt, value from samples where value != 0 and to_char(dt, 'YYYY') != '1970' order by dt desc) select dt, value, value-lead(value,1) over (order by dt desc) diff_value from temp1) select to_char(dt at time zone 'Europe/Copenhagen', 'YYYY-MM-DD') period, sum(diff_value) as value from temp2 group by period order by period) 

select dt_series.period, case when actuals.value != 0 then actuals.value else dt_series.value end from dt_series left join actuals on dt_series.period=actuals.period;
```

### this year, grouped by month ###
```
with 
dt_series as (select to_char(dt, 'YYYY-MM') period, 0 as value from generate_series(date_trunc('year', current_timestamp at time zone 'Europe/Copenhagen'), date_trunc('year', current_timestamp at time zone 'Europe/Copenhagen') + interval '1 year' - interval '1 day', interval '1 month') dt)
, 
actuals as (with temp2 as (with temp1 as (select dt, value from samples where value != 0 and to_char(dt, 'YYYY') != '1970' order by dt desc) select dt, value, value-lead(value,1) over (order by dt desc) diff_value from temp1) select to_char(dt at time zone 'Europe/Copenhagen', 'YYYY-MM') period, sum(diff_value) as value from temp2 group by period order by period) 

select dt_series.period, case when actuals.value != 0 then actuals.value else dt_series.value end from dt_series left join actuals on dt_series.period=actuals.period;
```