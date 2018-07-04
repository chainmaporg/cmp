'use strict';
//Global define
    // var Diamond = new BigNumber(200);
// var Gold = new BigNumber(100);
// var Silver = new BigNumber(50);
// var Brozen = new  BigNumber(25);
// var blockLimit = new BigNumber(10);

var Allowed = function (obj) {
    this.allowed = {};
    this.parse(obj);
};

Allowed.prototype = {
    toString: function () {
        return JSON.stringify(this.allowed);
    },

    parse: function (obj) {
        if (typeof obj != "undefined") {
            var data = JSON.parse(obj);
            for (var key in data) {
                this.allowed[key] = new BigNumber(data[key]);
            }
        }
    },
    get: function (key) {
        return this.allowed[key];
    },

    set: function (key, value) {
        this.allowed[key] = new BigNumber(value);
    }
};

var ChallengeContent = function(text) {
    if (text) {
         var o = JSON.parse(text);
         this.challengeLevel = new BigNumber(o.challengeLevel);
         this.challenge = o.challenge.toString();
         this.timeEstimation = o.timeEstimation.toString();
         this.author = o.author.toString();
         this.timeStamp = o.timeStamp.toString();
         this.blockHeight = new BigNumber(o.blockHeight);
         this.reward = false;
         this.answer = new Array();
    } else {
         this.challengeLevel = new BigNumber(0);
         this.challenge = "null";
         this.timeEstimation = "null";
         this.author = "null";
         this.timeStamp = "null";
         this.blockHeight = new BigNumber(0);
         this.reward = false;
         this.answer = new Array();
    }
};

ChallengeContent.prototype = {
    toString: function (){
        return JSON.stringify(this)
    }
    // body...
};

var answerContent = function(text) {
    if (text) {
        var o = JSON.parse(text);
        this.answerId = new BigNumber(o.answerId);
        this.answer = o.answer.toString();
        this.answered = o.answered.toString();
        this.timeStamp = o.timeStamp.toString();
        this.blockHeight = new BigNumber(o.blockHeight);
        this.like = new Array();
        this.dislike = new Array();
    } else {
        this.answerId = new BigNumber(0);
        this.answer = "null";
        this.answered = "null";
        this.timeStamp = "null";
        this.blockHeight = new BigNumber(0);
        this.like = new Array();
        this.dislike = new Array();

    }
};

answerContent.prototype = {
    // toString: function (){
    //     return JSON.stringify(this)
    // }
    // body...
};

var challengeContract = function () {
    LocalContractStorage.defineProperties(this, {
        _name: null,
        _symbol: null,
        //_decimals: null,
        _admin: null,
        _totalSupply: {
            parse: function (value) {
                return new BigNumber(value);
            },
            stringify: function (o) {
                return o.toString(10);
            }
        },
        Diamond: new BigNumber(200),
        Gold: new BigNumber(100),
        Silver: new BigNumber(50),
        Brozen: new  BigNumber(25),
        blockLimit: new BigNumber(10),
        startBlock: new BigNumber(0),
        changePoint: new BigNumber(1051200),
        reward: new BigNumber(0)
    });

    LocalContractStorage.defineMapProperties(this, {
        "balances": {
            parse: function (value) {
                return new BigNumber(value);
            },
            stringify: function (o) {
                return o.toString(10);
            }
        },
        "allowed": {
            parse: function (value) {
                return new Allowed(value);
            },
            stringify: function (o) {
                return o.toString();
            }
        },
        "ChallengeValut": {
        },
    });
};

challengeContract.prototype = {

 init: function () {
        this._name = "ChainMap";
        this._symbol = "CMAP";
        //this._decimals = decimals || 0;
        this._totalSupply = new BigNumber(10).pow(10).mul(new BigNumber(2));
        this.reward = Math.floor(this._totalSupply/2);
        //this._admin = "n1WJaKuQ8vQ8AzoGBZfYH3GLGzULQ2WwJvp";
        this._admin = "n1WJaKuQ8vQ8AzoGBZfYH3GLGzULQ2WwJvp";
        this.balances.set(this._admin, this._totalSupply.sub(this.reward));
        this.transferEvent(true, this._admin, this._admin, this._totalSupply.sub(this.reward));
        this.Diamond = new BigNumber(200);
        this.Gold = new BigNumber(100);
        this.Silver = new BigNumber(50);
        this.Brozen = new  BigNumber(25);
        this.blockLimit = new BigNumber(10);
        this.startBlock = Blockchain.block.height;
        this.changePoint = new BigNumber(1051200);
    },

    // Returns the name of the token
    name: function () {
        return this._name;
    },

    // Returns the symbol of the token
    symbol: function () {
        return this._symbol;
    },

    // Returns the number of decimals the token uses
    // decimals: function () {
    //     return this._decimals;
    // },

    totalSupply: function () {
        return this._totalSupply.toString(10);
    },

    balanceOf: function (owner) {
        var balance = this.balances.get(owner);

        if (balance instanceof BigNumber) {
            return balance.toString(10);
        } else {
            return "0";
        }
    },

    transfer: function (to, value) {
        value = new BigNumber(value);
        if (value.lt(0)) {
            throw new Error("invalid value.");
        }

        var from = Blockchain.transaction.from;
        var balance = this.balances.get(from) || new BigNumber(0);

        if (balance.lt(value)) {
            throw new Error("transfer failed.");
        }

        this.balances.set(from, balance.sub(value));
        var toBalance = this.balances.get(to) || new BigNumber(0);
        this.balances.set(to, toBalance.add(value));

        this.transferEvent(true, from, to, value);
    },

    transferFrom: function (from, to, value) {
        var spender = Blockchain.transaction.from;
        var balance = this.balances.get(from) || new BigNumber(0);

        var allowed = this.allowed.get(from) || new Allowed();
        var allowedValue = allowed.get(spender) || new BigNumber(0);
        value = new BigNumber(value);

        if (value.gte(0) && balance.gte(value) && allowedValue.gte(value)) {

            this.balances.set(from, balance.sub(value));

            // update allowed value
            allowed.set(spender, allowedValue.sub(value));
            this.allowed.set(from, allowed);

            var toBalance = this.balances.get(to) || new BigNumber(0);
            this.balances.set(to, toBalance.add(value));

            this.transferEvent(true, from, to, value);
        } else {
            throw new Error("transfer failed.");
        }
    },

    _poolTransfer: function (_to,_value) {
        _value = new BigNumber(_value);

        if (this.reward < _value){
            throw new Error("Run out of Token")
        }
        var toBalance = this.balances.get(_to) || new BigNumber(0);

        this.balances.set(_to, toBalance.add(_value));
        //what's this??? sub from reward!.
        //this.balances = this.balances.sub(_value);
        this.reward = this.reward-_value;

    },

    transferEvent: function (status, from, to, value) {
        Event.Trigger(this.name(), {
            Status: status,
            Transfer: {
                from: from,
                to: to,
                value: value
            }
        });
    },

    approve: function (spender, currentValue, value) {
        var from = Blockchain.transaction.from;

        var oldValue = this.allowance(from, spender);
        if (oldValue != currentValue.toString()) {
            throw new Error("current approve value mistake.");
        }

        var balance = new BigNumber(this.balanceOf(from));
        var value = new BigNumber(value);

        if (value.lt(0) || balance.lt(value)) {
            throw new Error("invalid value.");
        }

        var owned = this.allowed.get(from) || new Allowed();
        owned.set(spender, value);

        this.allowed.set(from, owned);

        this.approveEvent(true, from, spender, value);
    },

    approveEvent: function (status, from, spender, value) {
        Event.Trigger(this.name(), {
            Status: status,
            Approve: {
                owner: from,
                spender: spender,
                value: value
            }
        });
    },

    allowance: function (owner, spender) {
        var owned = this.allowed.get(owner);

        if (owned instanceof Allowed) {
            var spender = owned.get(spender);
            if (typeof spender != "undefined") {
                return spender.toString(10);
            }
        }
        return "0";
    },

    PostChallenge: function(address, challengeId, challengeLevel, challenge, timeEstimation){

        //check if the challenge  exsit
        if (this.ChallengeValut.get(challengeId) !== null){
            throw new Error("challenge exsited!");
        }

        var from = address;

        var challengeItem = new ChallengeContent();

        challengeItem.challengeLevel = challengeLevel.toString();
        challengeItem.challenge = challenge.toString();
        challengeItem.timeEstimation = timeEstimation.toString();
        challengeItem.author = from.toString();
        //challengeItem.timeStamp = new Date(); // Not right maybe
        challengeItem.timeStamp = Blockchain.block.timeStamp;
        challengeItem.blockHeight = Blockchain.block.height;

        this.ChallengeValut.put(challengeId,challengeItem);

        //this.my.put(challengeId, challengeLevel);
        return this.ChallengeValut.get(challengeId);
    },

    //check the exsitence of answer
    AnswerChallenge: function(address,challengeId, answerId, answer){

        //var from = Blockchain.transaction.from;

        var from = address;
        var challengeItem = this.ChallengeValut.get(challengeId);

        if (challengeItem === null) {
            throw new Error("challenge not exsit!");
        }

        //check the exsitence of answer
        for(var i = 0, answerLen = challengeItem.answer.length; i < answerLen; i++) {
            if(challengeItem.answer[i].answerId === answerId){
                throw new Error("answer exsited!")
            }
        }

        var answerItem = new answerContent();

        answerItem.answerId = answerId;
        answerItem.answer = answer;
        answerItem.answered = from;
        //answerItem.timeStamp = new Date(); // Not right maybe
        answerItem.timeStamp = Blockchain.block.timeStamp;
        answerItem.blockHeight = Blockchain.block.blockHeight;

        challengeItem.answer.push(answerItem);

        this.ChallengeValut.put(challengeId, challengeItem);
        return this.ChallengeValut.get(challengeId);
    },

    GetChallenge: function(challengeId){

        return this.ChallengeValut.get(challengeId);
    },

    VoteAnswer: function(address,challengeId,answerId,result){

        //var voter = Blockchain.transaction.from;
        var voter = address;
        var choose = result;

        var challengeItem = this.ChallengeValut.get(challengeId);
        if (challengeItem === null) {
            throw new Error("challenge not exsit!");
        }
        var answerItem = challengeItem.answer;

        var flag = false;
        for(var j = 0, length2 = answerItem.length; j < length2; j++){

            if (answerItem[j].answerId === answerId){

                for(var i = 0, length3 = answerItem[j].like.length; i < length3; i++){
                    if(answerItem[j].like[i] === voter) {
                        throw new Error("Only vote one answer once");
                    }
                }

                for(var k= 0, length4 = answerItem[j].dislike.length; k < length4; k++){
                    if (answerItem[j].dislike[k] === voter) {
                        throw new Error("Only vote onr answer once");
                    }

                }
                if (choose){
                    //answerItem[j].like = answerItem[j].like + 1;
                    answerItem[j].like.push(voter);
                    //challengeItem.answer = answerItem;
                    this.ChallengeValut.put(challengeId,challengeItem);
                }
                else {
                    answerItem[j].dislike.push(voter);
                    //challengeItem.answer = answerItem;
                    this.ChallengeValut.put(challengeId,challengeItem);
                }
                flag = true;
                break;
            }
        }
        if (!flag) {
            throw new Error("Answer not exsit!");
        } 
        return this.ChallengeValut.get(challengeId);

    },
    sortLike: function(a,b){
        if (a.like.length < b.like.length) {
                return 1;
        }
        else {
                return -1;
        }
    },

    //everyone  can call this func!!!!
    _tokenTransfer:function (_to, _value) {

        if (_to === "")
        {
            //if the _to address is null, retun directly
            return ;
        }
        this._poolTransfer(_to,_value);

        Event.Trigger("ChallengeValut", {
            Transfer: {
                to: _to,
                value: _value
            }
        });
    },

    RewardAll: function (challengeId) {

        var from = Blockchain.transaction.from;
        var challengeItem = this.ChallengeValut.get(challengeId);
        var answerItem = challengeItem.answer;
        var limit = Blockchain.block.height - challengeItem.blockHeight;
        var rewardAmount = new BigNumber(0);

        answerItem.sort(this.sortLike);

        if (challengeItem.reward){
            throw new Error("Reward only once");
        }
        // if (from !== challengeItem.author) {
        //     throw new Error("Only for challenge developer");
        // }
        if (answerItem.length === 0){
            throw new Error("No answer");
        }

        var multiple = Math.floor((new BigNumber(Blockchain.block.height) - this.startBlock)/this.changePoint);
        if (multiple !== 0){
            var base = Math.pow(2,multiple);
            this.Diamond = Math.floor(this.Diamond/base);
            this.Gold = Math.floor(this.Gold/base);
            this.Silver = Math.floor(this.Silver/base);
            this.Brozen = Math.floor(this.Brozen/base);
        }
        
        if (limit > this.blockLimit) {
        //if(true){
            if (challengeItem.challengeLevel === "Diamond") {
                rewardAmount = this.Diamond;
            }
            else if (challengeItem.challengeLevel === "Gold"){
                rewardAmount = this.Gold;
            }
            else if (challengeItem.challengeLevel === "Silver"){
                rewardAmount = this.Silver;
            }
            else if (challengeItem.challengeLevel === "Brozen"){
                rewardAmount = this.Brozen;
            }
            var firstLevel = Math.floor(rewardAmount*0.25);
            var secondLevel = Math.floor(rewardAmount*0.15);
            var thirdLevel = Math.floor(rewardAmount*0.1);
            var forthLevel = rewardAmount - firstLevel - secondLevel - thirdLevel;
            var answerAmount = answerItem.length;

            // for (var j = 0; j < answerItem.length; j++ ){
            //     var answerLimit = answerItem[j].blockHeight - challengeItem.blockHeight;
            //     if(answerLimit < limit) {
            //         answerAmount++;
            //         V
            //     }
            // }

            var firstSize = Math.ceil(answerAmount*0.2);
            var secondSize = Math.ceil(answerAmount*0.4);
            var thirdSize = answerAmount - firstSize - secondSize;

            for (var j_1 = 0; j_1 < firstSize; j_1++){
                var to_1 = answerItem[j_1].answered;
                //var from_1 = this._admin;
                var amount_1 = Math.floor(firstLevel/firstSize);

                this._tokenTransfer(to_1,amount_1);
            }

            for (var j_2 = 0; j_2 < secondSize; j_2++){
                var base_2 = j_2 + firstSize;
                if(base_2 >= answerItem.length){
                    break;
                }
                var to_2 = answerItem[base_2].answered;
                //var from_2 = this._admin;
                var amount_2 = Math.floor(secondLevel/secondSize);
                this._tokenTransfer(to_2,amount_2);
            }

            for (var j_3 = 0; j_3 < thirdSize; j_3++) {
                var base_3 = j_3+firstSize+secondSize;

                if(base_3 >= answerItem.length)
                {
                    break;
                }
                var to_3 = answerItem[base_3].answered;
                //var from_3 = this._admin;
                var amount_3 = Math.floor(thirdLevel/thirdSize);
                this._tokenTransfer(to_3,amount_3);
            }


            var forthSize = new BigNumber(0);
            for (var j_4 = 0;j_4<answerItem.length;j_4++){
                forthSize = forthSize + answerItem[j_4].like.length + answerItem[j_4].dislike.length;
            }

            forthSize++;

            var forthAmount = Math.floor(forthLevel/forthSize);

            for (var j_5 =0;j_5<answerItem.length;j_5++){

                for (var i = 0; i<answerItem[j_5].like.length;i++){
                    var like_to = answerItem[j_5].like[i];
                   // var like_from = this._admin;
                    this._tokenTransfer(like_to,forthAmount);
                }

                for (var k =0; k<answerItem[j_5].dislike.length;k++) {
                    var dislike_to = answerItem[j_5].dislike[i];
                    //var dislike_from = this._admin;
                    this._tokenTransfer(dislike_to,forthAmount);
                }

            }

            this._tokenTransfer(challengeItem.author,forthAmount);

            challengeItem.reward = true;
            this.ChallengeValut.put(challengeId,challengeItem);

        }
        else {
            throw new Error("Wait a minute.")
        }
    }

    // RewardAnswerFromPoster: function(challengeId) {
    //
    //     var answerItem = this.ChallengeValut.get(challengeId).answer;
    //
    //     var sortLike = function(a,b){
    //
    //         if (a.like.length < b.like.length) {
    //             return 1;
    //         }
    //         else {
    //             return -1;
    //         }
    //     };
    //
    //     answerItem.sort(sortLike);
    //
    //     for(var j = 0, length2 = 2; j < length2; j++){
    //
    //         if (answerItem[j].like > 2)
    //          {
    //             Event.Trigger("ChallengeValut", {
    //                 Transfer: {
    //                     from: Blockchain.transaction.from,
    //                     to: answerItem[j].answered,
    //                     value: Blockchain.transaction.value
    //                 }
    //             });
    //          }
    //     }
    //
    // },
    //
    // RewardChallenge: function(challengeId) {
    //
    //     var answerItem = this.ChallengeValut.get(challengeId).answer;
    //     var author = this.ChallengeValut.get(challengeId).author;
    //
    //     if (answerItem.length > 2){
    //
    //         Event.Trigger("ChallengeValut", {
    //             Transfer: {
    //                 from: Blockchain.transaction.from,
    //                 to: author,
    //                 value: Blockchain.transaction.value
    //             }
    //         });
    //     }
    // }


};

module.exports = challengeContract;

// wheather the BigNumber can use +-*/????

