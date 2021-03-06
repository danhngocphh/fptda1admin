var mongoose = require('mongoose');
var statsd = require('./statsd');

var schemaValue = mongoose.Schema({
    value: String,
    date: Date,
    count: Number
});
var Values = mongoose.model('keysearches', schemaValue);

var schemaLink = mongoose.Schema({
    value: String,
    link: String,
    title: String,
    date: Date,
    count: Number
});
var Links = mongoose.model('links', schemaLink);

var schematopLink = mongoose.Schema({
    name: String,
    date: Date,
    value: Object
});
var topLinks = mongoose.model('tops', schematopLink);

var schemaBlock = mongoose.Schema({
    kind: String,
    value: Object
});
var Blocks = mongoose.model('blocks', schemaBlock);

module.exports = {
    connectDB: function () {
        mongoose.connect("mongodb+srv://vegarnom:vegar8226@cluster0.eotns.mongodb.net/dbda1?retryWrites=true&w=majority  ");
        // mongoose.connect("mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false", { useNewUrlParser: true, useUnifiedTopology: true });
        const fsCnt = mongoose.connection;
        fsCnt.on('open', () => console.log('Connected'));
        fsCnt.on('err', () => console.log('Disconnected'));
    },
    updateGauge: function () {
        Values.count(function (err, result) {
            if (!err) {
                statsd.gauge('values', result);
            }
        })
    },
    getDash: async function (res) {
        let totalkey = 0;
        let totallink = 0;
        let title = '123';
        let values = [];
        let links = [];
        await Values.count({}, function (err, count) {
            totalkey = count;
        });
        await Links.count({}, function (err, countlink) {
            totallink = countlink;
        });

        var findnamekey = "topkeyall";
        var findnamelink = "toplinkall";
        topLinks.findOne({ name: findnamekey }, {}).
            then(function (result) {
                if (!result) {
                    res.render('index', { title, links: {}, values: {}, totalkey, totallink });
                } else {
                    for (let i in result.value) {
                        let val = result.value[i];
                        values[i] = [val.keyword, val.search_total, val.position];
                    }
                    selectionSortkey(values);
                    title = process.env.TITLE || 'Fshare demo'
                    topLinks.findOne({ name: findnamelink }, {}).
                        then(function (result) {
                            if (!result) {
                                res.render('index', { title, links: {}, values: {}, totalkey, totallink });
                            } else {
                                for (let i in result.value) {
                                    let link = result.value[i];
                                    links[i] = [link.link, link.search_total, link.title, link.position];
                                }
                                selectionSort(links);
                                title = process.env.TITLE || 'Fshare demo'
                                res.render('index', { title, links: links, values: values, totalkey, totallink });
                            }
                        }).catch(err => {
                            console.log(err.message);
                            res.render('index', { title, links: {}, values: {}, totalkey: {}, totallink: {} });
                        });
                }

            }).catch(err => {
                console.log(err.message);
                res.render('index', { title, links: {}, values: {}, totalkey: {}, totallink: {} });
            });
    },
    getBlock: function (kind, res) {
        let title = '';
        let values = [];
        Blocks.findOne({ kind: kind }, {}).
            then(function (result) {
                if (!result) {
                    res.render('block', { title, values: {}, kind });
                } else {
                    for (let i in result.value) {
                        let val = result.value[i];
                        values[i] = val;
                    }
                    res.render('block', { title, values, kind});
                }
            }).catch(err => {
                console.log(err.message);
                title = process.env.TITLE || 'Fshare demo'
                res.render('block', { title, values: {}, kind});
            });
    },
    getTopKey: function (value, res) {
        let title = '';
        let values = [];
        let time = '';
        let key = "topkeyall";
        let valuetimename = '';
        if (value != null) {
            key = value;
        }
        if (value == "topkeyall") {
            time = "All";
        }
        if (value == "topkeymonth") {
            time = "Month";
        }
        if (value == "topkeyweek") {
            time = "Week";
        }
        topLinks.findOne({ name: key }, {}).
            then(function (result) {
                if (!result) {
                    res.render('topkey', { title, values: {}, time });
                } else {
                    for (let i in result.value) {
                        let val = result.value[i];
                        values[i] = [val.keyword, val.search_total, val.position, i];
                    }
                    selectionSortkey(values);
                    title = process.env.TITLE || 'Fshare demo'
                    res.render('topkey', { title, values: values, time, valuetimename: value });
                }
            }).catch(err => {
                console.log(err.message);
                title = process.env.TITLE || 'Fshare demo'
                res.render('topkey', { title, values: {}, valuetimename });
            });
    },
    getTopLink: function (value, res) {
        let title = '';
        let links = [];
        let time;
        var key = "toplinkall";
        let valuetimename = '';
        if (value != null) {
            key = value;
        }
        if (value == "toplinkall") {
            time = "All";
        }
        if (value == "toplinkmonth") {
            time = "Month";
        }
        if (value == "toplinkweek") {
            time = "Week";
        }
        topLinks.findOne({ name: key }, {}).
            then(function (result) {
                if (!result) {
                    res.render('toplink', { title, links: {}, time, valuetimename });
                } else {
                    for (let i in result.value) {
                        let link = result.value[i];
                        links[i] = [link.link, link.search_total, link.title, link.position, i];
                    }
                    title = process.env.TITLE || 'Fshare demo'
                    selectionSort(links);
                    res.render('toplink', { title, links: links, time, valuetimename: value });
                }
            }).catch(err => {
                console.log(err.message);
                title = process.env.TITLE || 'Fshare demo'
                res.render('toplink', { title, links: {}, time, valuetimename });
            });
    },
    getValkey: async function (res) {
        let total = 0;
        let title = '';
        let values = {};
        await Values.count({}, function (err, count) {
            total = count;
        });
        Values.aggregate([
            { $group: { _id: '$value', i_total: { $sum: 1 }, date: { $push: '$date' } } },
            { $project: { _id: 1, i_total: 1 } }
        ]).
            then(function (result) {
                if (!result) {
                    res.render('key', { title, values, total }); // [ { maxBalance: 98000 } ]
                } else {
                    for (let i in result) {
                        let val = result[i];
                        let dateT = getDateT(val["date"]);
                        let Time = getDateTime(val["date"]);
                        values[val["_id"]] = [val["_id"], Time, dateT, val["i_total"]];
                    }
                    title = process.env.TITLE || 'Fshare demo'
                    res.render('key', { title, values: values, total: total }); // [ { maxBalance: 98000 } ]
                }
            });
    },
    getVallink: async function (res) {
        let total = 0;
        let title = '';
        let values = {};
        await Links.count({}, function (err, count) {
            total = count;
        });
        Links.aggregate([
            {
                $match: {
                    "link": { "$exists": true },
                    "title": { "$exists": true }
                }
            },
            { $group: { _id: { "link": "$link", "value": "$value" }, title: { $first: "$title" }, value: { $first: "$value" }, i_total: { $sum: 1 } } },
            { $project: { _id: 1, i_total: 1, title: 1, value: 1 } }
        ]).
            then(function (result) {
                if (!result) {
                    res.render('link', { title, values, total }); // [ { maxBalance: 98000 } ]
                } else {
                    let pos = 1;
                    for (let i in result) {
                        let val = result[i];
                        values[pos] = [val["_id"]["link"], val["title"], val["i_total"], val["value"]];
                        pos++;
                    }
                    title = process.env.TITLE || 'Fshare demo'
                    res.render('link', { title, values: values, total: total }); // [ { maxBalance: 98000 } ]
                }
            });
    },
    getlinkbytop10key: async function (key, res) {
        let total = 0;
        let keysearch = key;
        let values = {};
        await Links.count({}, function (err, count) {
            total = count;
        });
        Links.aggregate([
            { $group: { _id: '$link', value: { $first: "$value" }, title: { $first: "$title" }, i_total: { $sum: 1 } } },
            { $project: { _id: 1, i_total: 1, value: 1, title: 1 } }
        ]).
            then(function (result) {
                if (!result) {
                    res.render('top10key', { keysearch, values, total });
                } else {
                    for (let i in result) {
                        let val = result[i];
                        if (val["value"] === key) {
                            values[val["_id"]] = [val["_id"], val["value"], val["i_total"], val["title"]];
                        }
                    }
                    title = process.env.TITLE || 'Fshare demo'
                    res.render('top10key', { keysearch, values: values, total: total });
                }
            });
    },
    getVallinkbykey: async function (res) {
        let total = 0;
        let title = '';
        let values = {};
        await Links.count({}, function (err, count) {
            total = count;
        });
        Links.aggregate([
            { $group: { _id: '$value', i_total: { $sum: 1 } } },
            { $project: { _id: 1, i_total: 1 } }
        ]).then(function (result) {
            if (!result) {
                res.render('linkbykey', { title, values, total }); // [ { maxBalance: 98000 } ]
            } else {
                for (let i in result) {
                    let val = result[i];
                    values[val["_id"]] = [val["_id"], val["i_total"]];
                }
                title = process.env.TITLE || 'Fshare demo'
                res.render('linkbykey', { title, values: values, total: total }); // [ { maxBalance: 98000 } ]
            }
        });

    },
    getkeyDetail: async function (key, res) {
        let total = 0;
        await Values.count({ value: key }, function (err, count) {
            total = count;
        });
        Values.find({ value: key }, async function (err, result) {
            if (err) {
                console.log(err);
                res.send('database error');
                return
            }
            var values = {};
            for (var i in result) {
                var val = result[i];
                let dateT = getDateT(val["date"]);
                let Time = getDateTime(val["date"]);
                values[val["_id"]] = [val["value"], Time, dateT];
            }
            var title = process.env.TITLE || 'Fshare demo'
            res.render('key-detail', { title, key: key, values: values, total: total });
        });
    },
    getlinkbykeyDetail: async function (key, res) {
        let total = 0;
        await Links.count({ vaulue: key }, function (err, count) {
            total = count;
        });
        Links.find({ value: key }, async function (err, result) {
            if (err) {
                console.log(err);
                res.send('database error');
                return
            }
            var values = {};
            for (var i in result) {
                var val = result[i];
                let dateT = getDateT(val["date"]);
                let Time = getDateTime(val["date"]);
                values[val["_id"]] = [val["title"], val["link"], Time, dateT];
            }
            let keysearch = key;
            res.render('linkbykey-detail', { keysearch, key: key, values: values, total: total });
        });
    },
    getlinkbylinkDetail: async function (key, res) {
        let total = 0;
        await Links.count({ link: key }, function (err, count) {
            total = count;
        });
        Links.find({ link: key }, async function (err, result) {
            if (err) {
                console.log(err);
                res.send('database error');
                return
            }
            var values = {};
            for (var i in result) {
                var val = result[i];
                let dateT = getDateT(val["date"]);
                let Time = getDateTime(val["date"]);
                values[val["_id"]] = [val["title"], val["link"], Time, dateT, val["value"]];
            }
            let link = key;
            res.render('linkbylink-detail', { link, key: key, values: values, total: total });
        });
    },
    sendVal: function (val, date, res) {
        var request = new Values({ value: val, date: date });
        request.save((err, result) => {
            if (err) {
                console.log(err);
                res.send(JSON.stringify({ status: "error", value: "Error, db request failed" }));
                return
            }
            this.updateGauge();
            statsd.increment('creations');
            res.status(201).send(JSON.stringify({ status: "ok", value: result["value"], id: result["_id"] }));
        });
    },
    sendLink: function (val, link, title, date, res) {
        var request = new Links({ value: val, link: link, title: title, date: date });
        request.save((err, result) => {
            if (err) {
                console.log(err);
                res.send(JSON.stringify({ status: "error", value: "Error, db request failed" }));
                return
            }
            this.updateGauge();
            statsd.increment('creations');
            res.status(201).send(JSON.stringify({ status: "ok", value: result["value"], id: result["_id"] }));
        });
    },
    creatnewtop: function (name, res) {
        var request = new topLinks({ name: name, date: "", value: "" });
        request.save((err, result) => {
            if (err) {
                console.log(err);
                res.send(JSON.stringify({ status: "error", value: "Error, db request failed" }));
                return
            }
            this.updateGauge();
            statsd.increment('creations');
            res.send(JSON.stringify({ status: "ok", value: result["value"], id: result["_id"] }));
        });
    },
    updatetoplink: async function (timename, index, top, title, link, total, res) {
        var topLinkStorageTmp = {};
        let listblock = [];
        await Blocks.findOne({ kind: "link" }, {}).
            then(function (result) {
                if (!result) {
                } else {
                    for (let i in result.value) {
                        let val = result.value[i];
                        listblock[i] = val;
                    }
                }
            }).catch(err => {
                console.log(err.message);
            });
        if (index < 0) {
            var curr = new Date;
            switch (timename) {
                case null:
                    var dategtelink = new Date("2020-12-06T07:30:19.063Z");
                    var dateltlink = new Date();
                    nametoplink = "toplinkall";
                    break;
                case 'toplinkall':
                    var dategtelink = new Date("2020-12-06T07:30:19.063Z");
                    var dateltlink = new Date();
                    nametoplink = "toplinkall";
                    break;
                case "toplinkmonth":
                    var dategtelink = new Date(curr.getFullYear(), curr.getMonth(), 1);
                    var dateltlink = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);
                    nametoplink = "toplinkmonth";
                    break;
                case "toplinkweek":
                    var dategtelink = new Date(curr.setDate(curr.getDate() - curr.getDay()));
                    var dateltlink = new Date(curr.setDate(curr.getDate() - curr.getDay() + 6));
                    nametoplink = "toplinkweek";
                    break;
                case "toplinkyear":
                    var dategtelink = new Date(new Date().getFullYear(), 0, 1);
                    var dateltlink = new Date(new Date().getFullYear(), 11, 31)
                    nametoplink = "toplinkyear";
                    break;
                default:
                    var dategtelink = new Date("2020-12-06T07:30:19.063Z");
                    var dateltlink = new Date();
                    nametoplink = "toplinkall";
            }
            await Links.aggregate([
                { $match: { date: { $gte: dategtelink, $lt: dateltlink } , link: {$nin: listblock }} },
                { $group: { _id: '$link', i_total: { $sum: 1 }, title: { $first: "$title" } } },
                { $project: { _id: 1, i_total: 1, title: 1 } },
                { $sort: { i_total: -1 } },
                { $limit: 10 }
            ]).
                then(function (result) {
                    if (!result) {
                    } else {
                        for (let i in result) {
                            let val = result[i];
                            let posTmp = parseInt(i) + 1;
                            topLinkStorageTmp[parseInt(i)] = { 'position': posTmp, 'link': val["_id"], 'title': val["title"], 'search_total': val["i_total"] }
                        }
                    }
                });
        } else {
            await topLinks.findOne({ name: timename }, {}).
                then(function (result) {
                    if (!result) {
                    } else {
                        for (let i in result.value) {
                            if (i == index) {
                                topLinkStorageTmp[parseInt(i)] = { 'position': parseInt(top), 'link': link, 'title': title, 'search_total': parseInt(total) }
                            } else {
                                let link = result.value[i];
                                topLinkStorageTmp[parseInt(i)] = { 'position': link.position, 'link': link.link, 'title': link.title, 'search_total': link.search_total }
                            }
                        }
                    }
                }).catch(err => {
                    console.log(err.message);
                });
        }
        await topLinks.update({ name: timename }, { $set: { value: topLinkStorageTmp } }, (err, result) => {
            if (err) {
                console.log(err);
                res.send(JSON.stringify({ status: "error", value: "Error, db request failed" }));
                return
            }
            this.updateGauge();
            statsd.increment('creations');
            res.redirect('/toplink/' + timename);
        });
    },
    updatetopkey: async function (timename, index, top, key, total, res) {
        index = parseInt(index);
        var topKeyStorageTmp = {};
        let listblock = [];
        await Blocks.findOne({ kind: "key" }, {}).
            then(function (result) {
                if (!result) {
                } else {
                    for (let i in result.value) {
                        let val = result.value[i];
                        listblock[i] = val;
                    }
                }
            }).catch(err => {
                console.log(err.message);
            });
        if (index < 0) {
            var curr = new Date;
            switch (timename) {
                case null:
                    var dategte = new Date("2020-12-06T07:30:19.063Z");
                    var datelt = new Date();
                    namekeylink = "topkeyall";
                    break;
                case 'topkeyall':
                    var dategte = new Date("2020-12-06T07:30:19.063Z");
                    var datelt = new Date();
                    namekeylink = "topkeyall";
                    break;
                case "topkeyweek":
                    var dategte = new Date(curr.setDate(curr.getDate() - curr.getDay()));
                    var datelt = new Date(curr.setDate(curr.getDate() - curr.getDay() + 6));
                    namekeylink = "topkeyweek";
                    break;
                case "topkeymonth":
                    var dategte = new Date(curr.getFullYear(), curr.getMonth(), 1);
                    var datelt = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);
                    namekeylink = "topkeymonth";
                    break;
                case "topkeyyear":
                    var dategte = new Date(new Date().getFullYear(), 0, 1);
                    var datelt = new Date(new Date().getFullYear(), 11, 31)
                    namekeylink = "topkeyyear";
                    break;
                default:
                    var dategte = new Date("2020-12-06T07:30:19.063Z");
                    var datelt = new Date();
                    namekeylink = "topkeyall";
            }
            //["123","1233"]
            await Values.aggregate([
                { $match: { date: { $gte: dategte, $lt: datelt } , value: {$nin: listblock }} },
                { $group: { _id: '$value', i_total: { $sum: 1 } } },
                { $project: { _id: 1, i_total: 1, date: 1 } },
                { $sort: { i_total: -1 } },
                { $limit: 10 }
            ]).then(function (result) {
                if (!result) {
                } else {
                    for (let i in result) {
                        let val = result[i];
                        let posTmp = parseInt(i) + 1;
                        topKeyStorageTmp[parseInt(i)] = { 'position': posTmp, 'keyword': val["_id"], 'search_total': val["i_total"] }
                    }
                }
            });
        } else {
            await topLinks.findOne({ name: timename }, {}).
                then(function (result) {
                    if (!result) {
                    } else {
                        for (let i in result.value) {
                            if (i == index) {
                                topKeyStorageTmp[parseInt(i)] = { 'position': parseInt(top), 'keyword': key, 'search_total': parseInt(total) }
                            } else {
                                let val = result.value[i];
                                topKeyStorageTmp[parseInt(i)] = { 'position': val.position, 'keyword': val.keyword, 'search_total': val.search_total }
                            }
                        }
                    }
                }).catch(err => {
                    console.log(err.message);
                });
        }
        await topLinks.update({ name: timename }, { $set: { value: topKeyStorageTmp } }, (err, result) => {
            if (err) {
                console.log(err);
                res.send(JSON.stringify({ status: "error", value: "Error, db request failed" }));
                return
            }
            this.updateGauge();
            statsd.increment('creations');
            res.redirect('/topkey/' + timename);
        });
    },
    delblock: async function (kind, _value, res) {
        let values = [];
        await Blocks.findOne({ kind: kind }, {}).
            then(function (result) {
                if (!result) {
                } else {
                    for (let i in result.value) {
                        let val = result.value[i];
                        values[i] = val;
                    }
                }
            }).catch(err => {
                console.log(err.message);
            });
        const removeValue = values.filter(function (value, index, arr) {
            return value != _value;
        });
        await Blocks.update({ kind: kind }, { $set: { value: removeValue } }, (err, result) => {
            if (err) {
                console.log(err);
                res.send(JSON.stringify({ status: "error", value: "Error, db request failed" }));
                return
            }
            this.updateGauge();
            statsd.increment('creations');
            res.redirect('/block/' + kind);
        });
    },
    addblock: async function (kind, _value, res) {
        let values = [];
        await Blocks.findOne({ kind: kind }, {}).
            then(function (result) {
                if (!result) {
                } else {
                    for (let i in result.value) {
                        let val = result.value[i];
                        values[i] = val;
                    }
                }
            }).catch(err => {
                console.log(err.message);
            });
         values.push(_value);
        await Blocks.update({ kind: kind }, { $set: { value: values } }, (err, result) => {
            if (err) {
                console.log(err);
                res.send(JSON.stringify({ status: "error", value: "Error, db request failed" }));
                return
            }
            this.updateGauge();
            statsd.increment('creations');
            res.redirect('/block/' + kind);
        });
    },
    delVal: function (id) {
        Values.remove({ _id: id }, (err) => {
            if (err) {
                console.log(err);
            }
            this.updateGauge();
            statsd.increment('deletions');
        });
    }
};
// Use of Date.now() method 
function getDateTime(dateIP) {
    let today = new Date(dateIP);
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    return time;
}

function getDateT(dateIP) {
    let today = new Date(dateIP);
    let date = today.getDate() + '-' + (today.getMonth() + 1) + '-' + today.getFullYear();
    return date;
}
function selectionSort(array) {
    for (let i = 0; i < array.length - 1; i++) {
        let idmin = i;
        for (let j = i + 1; j < array.length; j++) {
            if (array[j][3] < array[idmin][3]) idmin = j;
        }
        let t = array[i];
        array[i] = array[idmin];
        array[idmin] = t;
    }
}

function selectionSortkey(array) {
    for (let i = 0; i < array.length - 1; i++) {
        let idmin = i;
        for (let j = i + 1; j < array.length; j++) {
            if (array[j][2] < array[idmin][2]) idmin = j;
        }
        let t = array[i];
        array[i] = array[idmin];
        array[idmin] = t;
    }
}
