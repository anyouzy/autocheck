(function () {

    if (window.location.search.includes('site=csfr') || window.location.search.includes('site=csde')) return;


    class AutoCheck {
        constructor(scope, title, checkBoxes, originalCurrency) {
            this.scope = scope;
            this.title = title;
            this.matchRes = '';
            this.checkBoxes = checkBoxes;
            this.len = checkBoxes.length;
            this.originalCurrency = originalCurrency;
            this.sitewide = false;
            this.sitewideChecked = this.percentChecked = this.moneyChecked = this.clearanceChecked = this.fsChecked = this.rebateChecked = this.rewardChecked = this.ftChecked = this.fdChecked = this.fgChecked = this.fsamChecked = this.bngnChecked = this.fromChecked = false;
            this.lastCurrency = '';
            this.lastNumber = '';
            this.currencySymbolStr = "\\$|€|£|Rs|RS\\.|¥|₦|CHF|USD|CAD|GBP|POUND|RMB|AUD|INR|EUR|US\\$|CA\\$|AU\\$";
            this.currencyNumberStr = "\\d+|\\d+\\.\\d+|(\\d{1,3},)?\\d{1,3},\\d{3}";
            this.currencyStr = `(?:(?:(?:${this.currencySymbolStr})\\s?)(?:${this.currencyNumberStr})\\+?|(?:${this.currencyNumberStr})\\+?\\s?(?:${this.currencySymbolStr}))`;
            this.percentNumberStr = `(?:(?:(?:\\d+|\\d+\\.\\d+)%)|(?:\\d+\\/\\d+)|(?:half(?: price)?))`;
            this.initScopeCheck();
            this.initPromoCheck();
        }

        initScopeCheck() {
            this.scope[2].checked = true;
            this.sitewideCheck();
        }

        sitewideCheck() {
            let s = this.title.value;
            if (!s || s.match(/(?:new customer)|student/gi)) return;
            this.matchRes = s.match(/ on \D+\s?\d+\+?|sitewide|site wide|site-wide|storewide|store wide|store-wide|(?:whole|entire) (?:site|store)|everything|(?:all|total|every|each|any|your|your first|first|1st|all of your|entire|one|\d+) (?:orders?|next order|purchases?|next purchase|products?|merchandise|items?|brands?|category|categories)|(?:(?:(?:when (?:spend|spending|you spend)|with (?:orders?|purchases?) of) \D+\s?\d+\+?)|with \D+\d+\+?(?:\s(?:orders?|purchases?))+)(?:$|\s(?!on))/gi);
            if (this.matchRes === null) {
                this.sitewideChecked = false;
                this.scope[0].checked = false;
                this.scope[2].checked = true;
            }
            else {
                if (this.sitewideChecked) return;
                this.sitewideChecked = true;
                this.scope[0].checked = true;
                this.checkBoxes[3].checked = false;
            }
        }

        promoDetailCheck(index, regRule, flag, FnSuccess = function () { }, FnFail = function () { }, specialCheck = false) {
            let s = this.title.value;
            if (!s) return;
            this.matchRes = s.match(regRule);
            if (specialCheck) {
                if (this.matchRes === null) {
                    this.checkBoxes[index].checked = false;
                    FnFail();
                    return;
                }
                FnSuccess(this.matchRes);
            }
            else {
                if (this.matchRes === null) {
                    flag = false;
                    this.checkBoxes[index].checked = false;
                    FnFail();
                    return;
                }
                if (flag) return;
                flag = true;
                this.checkBoxes[index].checked = true;
                FnSuccess(this.matchRes);
            }
        }

        fsCheck() {
            let regRule = /(?:(?:free|complimentary)+(?:.*)?(?:shipping|shipment|fs|s&h|delivery|postage|p&p|click|carriage|freight)|(?:(?:${this.currencySymbol})\s?0 ship))/gi;
            this.promoDetailCheck(0, regRule, this.fsChecked);
        }

        getCurrency(currency) {
            switch (currency) {
                case '$':
                case 'usd':
                case 'cad':
                case 'aud':
                case 'us$':
                case 'ca$':
                case 'au$':
                    currency = 'dollar';
                    break;
                case '£':
                case 'gbp':
                case 'pound':
                    currency = 'pound';
                    break;
                case '€':
                case 'eur':
                    currency = 'euro';
                    break;
                case 'rmb':
                case '¥':
                case 'cny':
                    currency = 'rmb';
                    break;
                case 'rs':
                case 'inr':
                case 'rs.':
                    currency = 'rupee';
                    break;
                case '₦':
                    currency = 'naira';
                    break;
                case 'chf':
                    currency = 'chf';
                    break;
            }
            return currency;
        }

        confirmVal(res, regRule, isFrom = false) {
            let resobj = {};
            let moneyArr = [];
            let currencySymbol = '';
            let currencyNumber = 0;
            res.forEach((v) => {
                v.match(regRule);
                currencySymbol = this.getCurrency((RegExp.$1 || RegExp.$6).toLowerCase());
                currencyNumber = RegExp.$2 || RegExp.$4;
                currencyNumber = currencyNumber.includes(',') ? currencyNumber.replace(/,/gi, '') : currencyNumber;
                moneyArr.push(currencyNumber);
            });
            currencyNumber = isFrom ? Math.min(...moneyArr) : Math.max(...moneyArr);
            resobj.currencySymbol = currencySymbol;
            resobj.currencyNumber = currencyNumber;
            return resobj;
        }

        toTwoDecimals(val) {
            return Number.isInteger(val) ? val : val.toFixed(2);
        }

        moneyCheck() {
            let regRule = new RegExp(`(?:${this.currencyStr}\\s(?:off|discounts?|savings?|(?:\\w+\\s)+(?:e-gift cards?|e-gift certificates?|gift cards?|gift certificates?|vouchers?|gift vouchers?))(?:\\s|$))|(?:save\\s(up to |over |more than |at least )?${this.currencyStr}(?:\\s|$))`, "gi");
            this.promoDetailCheck(1, regRule, this.moneyChecked, (res) => {
                let newRegRule = new RegExp(`(?:(?:(${this.currencySymbolStr})\\s?(${this.currencyNumberStr})\\+?)|(?:(${this.currencyNumberStr})\\+?\\s?(${this.currencySymbolStr})))(?:\\s|$)`, "gi");
                let resobj = this.confirmVal(res, newRegRule);
                resobj.currencyNumber = this.toTwoDecimals(resobj.currencyNumber);
                this.checkBoxes[1].parentElement.nextElementSibling.value = resobj.currencySymbol;
                this.checkBoxes[1].parentElement.nextElementSibling.nextElementSibling.value = resobj.currencyNumber;
            }, () => {
                this.checkBoxes[1].parentElement.nextElementSibling.value = this.originalCurrency;
                this.checkBoxes[1].parentElement.nextElementSibling.nextElementSibling.value = '';
            });
        }

        percentCheck() {
            let regRule = new RegExp(`(?:save\\s(up to |at least |more than |over )?${this.percentNumberStr}(?:\\s|$))|(?:${this.percentNumberStr}\\s(?:on|off|discounts?|savings?)(?:\\s|$))`, "gi");
            this.promoDetailCheck(2, regRule, this.percentChecked, (res) => {
                let percentArr = [];
                let percentNumber = 0;
                res.forEach(function (v) {
                    v.match(/((\d+|\d+\.\d+)%)|((\d+)\/(\d+))|(half( price)?)/gi);
                    percentNumber = RegExp.$6 ? 50 : (RegExp.$3 ? (RegExp.$4 / RegExp.$5) * 100 : RegExp.$2);
                    percentArr.push(percentNumber);
                });
                percentNumber = Math.max(...percentArr);
                percentNumber = this.toTwoDecimals(percentNumber);
                this.checkBoxes[2].parentElement.nextElementSibling.value = percentNumber;
            }, () => {
                this.checkBoxes[2].parentElement.nextElementSibling.value = '';
            });
        }

        clearanceCheck() {
            this.sitewide = document.querySelector('input[value=SITE_WIDE]').checked;
            let s = this.title.value;
            if (this.sitewide || s.match(/non[-\s]?sale/gi)) return;
            let regRule = /\s?(?:clearance|closeout|sale)\s?/gi;
            this.promoDetailCheck(3, regRule, this.clearanceChecked);
        }

        bngnCheck() {
            let regRule = /buy one,? get one free|bogof|bogo fr|(?:^\d+|\s\d+) for \d+|(?:^\d+|\s\d+) for the price of \d+|buy \d+\s?,? get \d+ fr|buy \d+ [^,]+, get \d+ free/gi;
            this.promoDetailCheck(4, regRule, this.bngnChecked);
        }

        fgCheck() {
            let regRule = /\s?(?:free|complimentary)\s(?:gifts?)/gi;
            this.promoDetailCheck(5, regRule, this.fgChecked, () => {
                this.checkBoxes[5].checked = true;
            }, function () { }, true);
        }

        fsamCheck() {
            let regRule = /\s?(?:free|complimentary)\s(?:\w+\s)*sample/gi;
            this.promoDetailCheck(6, regRule, this.fgChecked, () => {
                this.checkBoxes[6].checked = true;
            }, function () { }, true);
        }

        fdCheck() {
            let regRule = /(?:free|complimentary)+(?:.*)?\sdownload/gi;
            this.promoDetailCheck(7, regRule, this.fdChecked);
        }

        ftCheck() {
            let regRule = /(?:free|complimentary)+(?:.*)?\strial/gi;
            this.promoDetailCheck(8, regRule, this.ftChecked);
        }

        rebateCheck() {
            let regRule = /\srebates?(?:\s|$)/gi;
            this.promoDetailCheck(9, regRule, this.rebateChecked);
        }

        rewardCheck() {
            let regRule = /\s(?:award|reward|bonus|cashback|cash back|point|credit)s?/gi;
            this.promoDetailCheck(10, regRule, this.rewardChecked);
        }

        otherCheck() {
            let s = this.title.value;
            if (!s) {
                this.checkBoxes[11].checked = false;
                return;
            }
            let isAnyoneChecked = false;
            for (let i = 0; i < this.len; i++) {
                if (i === 11) continue;
                if (this.checkBoxes[i].checked) {
                    isAnyoneChecked = true;
                    this.checkBoxes[11].checked = false;
                    break;
                }
            }
            if (!isAnyoneChecked) this.checkBoxes[11].checked = true;
        }

        fromCheck() {
            let regRule = new RegExp(`\\s*(?:from|(?:starts?|starting)\\s(?:from|at)|as low as|low to|as little as)\\s(?:just\\s|under\\s|only\\s)?(?:${this.currencyStr}\\s?(?:pp|\\/each)?(?:$|\\s))`, "gi");
            this.promoDetailCheck(12, regRule, this.fromChecked, (res) => {
                let newRegRule = new RegExp(`(?:(${this.currencySymbolStr})\\s?(${this.currencyNumberStr})\\+?\\s?(?:pp|\\/each)?(?:$|\\s))|(?:(${this.currencyNumberStr})\\+?\\s?(${this.currencySymbolStr})\\s?(?:pp|\\/each)?(?:$|\\s))`, "gi");
                let resobj = this.confirmVal(res, newRegRule, true);
                resobj.currencyNumber = this.toTwoDecimals(resobj.currencyNumber);
                this.checkBoxes[12].checked = true;
                this.checkBoxes[12].parentElement.nextElementSibling.value = resobj.currencySymbol;
                this.checkBoxes[12].parentElement.nextElementSibling.nextElementSibling.value = resobj.currencyNumber;
            }, () => {
                this.checkBoxes[12].parentElement.nextElementSibling.value = this.originalCurrency;
                this.checkBoxes[12].parentElement.nextElementSibling.nextElementSibling.value = '';
            }, true);
        }

        initPromoCheck() {
            this.percentCheck();
            this.moneyCheck();
            this.clearanceCheck();
            this.bngnCheck();
            this.fgCheck();
            this.fsamCheck();
            this.fsCheck();
            this.fdCheck();
            this.ftCheck();
            this.rebateCheck();
            this.rewardCheck();
            this.fromCheck();
            this.otherCheck();
            this.sitewideCheck();
        }

        bindEvent() {
            this.title.addEventListener('input', (e) => {
                this.initPromoCheck();
            }, false);
        }
    }


    let oAutoCheck = new AutoCheck(document.querySelectorAll("input[name='scope_apply']"), document.querySelector('#title'), document.querySelectorAll('#PromotionDetail > div > p > span > input[type=checkbox]'), document.querySelector("[name='money_type[money]']").value);
    oAutoCheck.bindEvent();
    document.querySelector('input[value=SITE_WIDE]').addEventListener('click', function () {
        document.querySelector('input[value=sale_clearance]').checked = false;
    }, false);


})();
