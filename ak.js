// @name           plwiza_ak
// @version        13
// @author         13
// @description    ak for plwiza.user.js

var continue_plwiza ,configure_plwiza ,read_xls_data ,fill_plwizaform_items

(function plwiza_closure(w ,doc ,lost ,alert ,setTimeout ,con){
//devel: localStorage['plwizadev'] = '1'

var ver = 'v13'
,Gorod = 'Брест'
,Vid = 'ПОКУПКИ' //'ПОКУПКИ', 'ГОСТ'....
,Srok = ''       //'2015-03-11'
,BPEM9 = 555     // время заполнения одного элемента
,plwizaCFG = {
    city: Gorod ,type: Vid ,date: Srok ,milliSecItem: BPEM9 ,startTime: '12:00:21'
}

                                //к//о//д//и//н//г//
var site = 'https://rejestracja.by.e-konsulat.gov.pl/'
    ,siteRegBlank = site + 'Uslugi/RejestracjaTerminu.aspx?IDUSLUGI=8&IDPlacowki=0'
    ,siteForm  = site + 'Wiza/FormularzWiza.aspx?tryb=REJ'
    ,siteFormP = site + 'Wiza/FormularzWiza.*'

    ,postPlac = "__doPostBack('ctl00$tresc$cbListaPlacowek','')"

// "siteRegBlank"
    ,id_vid = 'ctl00_cp_f_cbRodzajUslugi'
    ,dataJ = 0 ,darr ,fa = [] //poiner, demo array and one for deferred filling

/* helpers */
function gi(i){ return doc.getElementById(i) }
function gt(n){ return doc.getElementsByTagName(n)[0] }
function gs(n){ return doc.getElementsByTagName(n) }
function ce(v){ return doc.createEvent(v) }
function cl(t){ return doc.createElement(t) }
function q(s) { return s ? String(s).replace(/'/g, "\\'") : '' }
function pad(n){return n < 10 ? '0' + n : n }

function mkClick(){
    var ev = ce("MouseEvents")
    ev.initMouseEvent("click", true, true, w, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    return ev
}

function mkChange(){
    var ev = ce("HTMLEvents")
    ev.initEvent("change", true, true)
    return ev
}

function selectOption(el, val, last_item){
try {
    if(typeof el == 'string') { el = gi(el) }
    var i
    if(val) for (i = 0; i < el.options.length; i++){
        if (RegExp(val).test(el.options[i].text)){
            break
        }
    } else {
        i = last_item ? el.options.length - 1 : 1
    }
    if(el.selectedIndex !== i){
        el.focus()
        el.selectedIndex = i
        el.dispatchEvent(mkChange())
        return true
    }
    return undefined
} catch(e) { alert ("Случилась херь в selectOption: " + e) }
}

function _msg_screen(msg){
    var x ,el = gi("llogg")
    if (!el) {
        x = cl("div")
        x.setAttribute("style",
            "font-size:10pt; background-color:orange; position:fixed;"+
            "top:21px;left:7px;z-index:77;padding:2px"
        )
        x.innerHTML = '<input value="Начать" style="font-weight:bold" ' +
            (lost['plwizago'] ? 'disabled' : 'enabled') + '="true" ' +
            'onclick="javascript:(function(t){' +
"var el ,stop = document.getElementById('idStop');" +
"stop.removeAttribute('disabled'); stop.setAttribute('enabled', true);" +
"delete t.enabled; t.disabled = true;" +
"continue_plwiza();" +
            '})(this)" id="idStart" type="button"/>' +
            '<b style="color:white">:) Автозаполнение ' + ver + '(:</b>' +
            '<input value="Остановить" style="font-weight:bold" ' +
            (lost['plwizago'] ? 'enabled' : 'disabled') + '="true" ' +
            'onclick="javascript:(function(t){' +
"var start = document.getElementById('idStart');" +
"start.removeAttribute('disabled'); start.setAttribute('enabled', true);" +
"delete localStorage.plwizago; delete t.enabled; t.disabled = true;" +
            '})(this)" id="idStop" type="button"/>' +
            '<input value="Сбросить конфиг" style="font-weight:bold" ' +
            (lost['plwizacfg'] ? 'enabled' : 'disabled') + '="true" ' +
            'onclick="javascript:' +
"delete localStorage.plwizacfg; delete this.enabled; this.disabled = true;" +
            '" id="idClearCFG" type="button"/>'

        gt('body').appendChild(x)

        el = cl("div")
        el.setAttribute("id","llogg")
        el.setAttribute("style",
            "font-size:10pt; background-color:#FFE4E1;" +
            "z-index:77; padding:7px"
        )
        x.appendChild(el)
    }
    if(msg){
        el.innerHTML += '<b style="color:black">' + msg + '</b><br/>'
    }
    return el
}

continue_plwiza = continuePlwiza
function continuePlwiza(){
    var el ,msg

    if((el = gi('cfgd'))){
        gi('llogg').childNodes[0].removeChild(el)
        msg = 'Начинаем работу с конфигурацией по умолчанию:<br/>' +
              '<b style="color:green">' + JSON.stringify(plwizaCFG) + '</b>'
    } else {
        if((msg = lost['plwizacfg'])){
            plwizaCFG = JSON.parse(msg)
            msg = 'Продолжаем работу автозаполнения. Конфигурация(кэш):<br/>' +
                  '<b style="color:green">' + msg
        } else {
            msg = 'Продолжаем работу автозаполнения. Конфигурация(умолчания):<br/>' +
                  '<b style="color:green">' + JSON.stringify(plwizaCFG)
        }
    }

    _msg_screen(msg)
    lost['plwizago'] = '1'
    setTimeout(mainPlwiza ,123)
}

configure_plwiza = onclickPlwizaCfg
function onclickPlwizaCfg() {
try {
    var cols ,upd
        ,rows = gi("ccfgg").value.split('\n')
        ,i = /Настро/.test(rows[0]) ? 0 : -1
    plwizaCFG.startTime = ''
    while (++i < rows.length) {
        cols = rows[i].split('\t')
        if (/Город/.test(cols[0]) && cols[1]) {
            Gorod = cols[1] ,upd = true
            lost['Gorod'] = Gorod
        } else if (/Вид/.test(cols[0]) && cols[1]) {
            Vid = cols[1] ,upd = true
            lost['vid'] = Vid
        } else if (/Срок/.test(cols[0]) && cols[1]) {
            Srok = cols[1] ,upd = true
            lost['Srok'] = Srok
        } else if (/Время/.test(cols[0]) && cols[1]) {
            BPEM9 = cols[1] ,upd = true
            lost['BPEM9'] = BPEM9
        } else if (/Начало/.test(cols[0]) && cols[1]) {
            plwizaCFG.startTime = cols[1] ,upd = true
        }
    }
    if (!upd) {
        _msg_screen('Пустая конфигурация!')
        return
    }

    plwizaCFG.city = Gorod
    plwizaCFG.type = Vid
    plwizaCFG.milliSecItem = BPEM9
    plwizaCFG.date = Srok

    lost['plwizacfg'] = JSON.stringify(plwizaCFG)
    lost['plwizago'] = '1'
    cols = gi('idClearCFG')
    cols.removeAttribute('disabled') ; cols.setAttribute('enabled', true)

    _msg_screen('Конфигурация записана в кэш:<br/>' +
        '<b style="color:green">' + JSON.stringify(plwizaCFG)
    )
    setTimeout(mainPlwiza ,123)
    return
} catch (e) { alert("Случилась херь plWizaCfg: " + e) }
}

/*       ====    MAIN RUN    ====        */
         mainPlwiza()
         return
/*       ====    MAIN END    ====        */

function mainPlwiza(){
    var te ,i

    if((te = gi("ctl00_ddlWersjeJezykowe"))){
        if(selectOption(te ,'Русс')) return // no other actions
    }// select language

    if(!lost['plwizago']){// if stop
        _msg_screen(
"<div id='cfgd'><b style='color:black'>Настройки. По умолчанию:<br/><b style='color:green'>" +
JSON.stringify(plwizaCFG) + "</b><br/>или скопировать из " +

"<b><u><a style='color:blue' href='https://github.com/olecom/plwiza.user.js/raw/master/plwiza_form.xlt'>" +
"Excel'а (файл в этой сслыке)</a></u></b> <b style='color:red'>CTRL+C</b> область настроек<br/>" +
"вставить <b style='color:green'>здесь</b> <b style='color:red'>CTRL+V</b>:</b><br/>" +
'<textarea id="ccfgg" style="font-size:8pt;background-color:lightblue" rows="4" cols="77"></textarea><br/>' +
'<input value="Настроить из вставки" onclick="javascript:configure_plwiza()" type="button"/> ' +
(lost['plwizacfg'] ? "Сохранённая в кэше конфигурация:<br/><b style='color:green'>" +
 lost['plwizacfg'] : '' ) +
'</div>'
        )
        try {
            gi('ctl00_cp_BotDetectCaptchaCodeTextBox').focus()
            setTimeout(
                "document.getElementById('ctl00_cp_BotDetectCaptchaCodeTextBox').focus()"
                ,0
            )//Firefox focus() fix (doesn't work)
        } catch (e) { }
        return
    }// need staring [configuration] or [start] button click
    if((te = lost['plwizacfg'])) plwizaCFG = JSON.parse(te)

    if((te = gi('ctl00_tresc_cbListaPlacowek'))){
        /* <option value="93">Брест</option>
           <option value="95">Гродно</option>
           <option value="94">Минск</option> */
        te.focus()
        _msg_screen('Автозаполняем Город...')
        selectOption(te ,plwizaCFG.city)
        if(lost.plwizadate) { delete lost.plwizadate }

        return // no other actions
    }// select City/Town/Placowek: from cfg, user select or default

    if((te = gi('ctl00_cp_BotDetectCaptchaCodeTextBox'))){
        scrollTo(111,1111)
        te.focus()
        te.dispatchEvent(mkClick())//Firefox focus() fix try

        _msg_screen("Нужно вбить содержимое картинки в поле ввода. Тут не могу помочь." +
            '<br/>Конфигурация:<br/><b style="color:green">' +
            JSON.stringify(plwizaCFG) + '</b>'
        )

        return
        //old: ctl00_cp_f_KomponentObrazkowy_VerificationID
        //new: ctl00_cp_BotDetectCaptchaCodeTextBox
    }

    /* == Finding of enabled types with dates ==*/

    if((te = gi('ctl00_cp_cbDzien'))){
        if(!lost.plwizadate)// show beleived to be the date of the so-wantohave visa
            lost.plwizadate = te.options[te.options.length - 1].text

        selectOption(te ,0 ,'last_item')

        if((te = gi('ctl00_cp_btnRezerwuj'))){
            _msg_screen('Жму [Зарегистрироваться]')
            te.focus()
            te.dispatchEvent(mkClick())
            return
        }
        return
        //<select name="ctl00$cp$cbDzien" id="ctl00_cp_cbDzien" onchange="cbDzienGodzina_onChange(this);"
        /* old:
         * ,id_Srok = 'ctl00_cp_f_cbTermin'
         * ,postSrok = "__doPostBack('ctl00$cp_f$cbTermin','')"
         * */
    }

    if((te = gi('ctl00_cp_cbRodzajUslugi'))){
        _msg_screen(
            'Выбор услуги: ' + plwizaCFG.type + (plwizaCFG.startTime ?
            ' начало в ' + plwizaCFG.startTime +
            ', сейчас: <b id="startTime" style="color:lightblue"></b>' : '')
        )
        scrollTo(111,1111)

        if(plwizaCFG.startTime){
            // "12:01".slice(3)  -> 01
            // "12:01".slice(0,2)-> 12
            function set_delay(){
                var d = new Date(), dd = new Date(d)
                d.setHours(parseInt(plwizaCFG.startTime.slice(0, 2)))
                d.setMinutes(parseInt(plwizaCFG.startTime.slice(3, 5)))
                d.setSeconds(parseInt(plwizaCFG.startTime.slice(6, 8)))
                gi('startTime').innerHTML = pad(dd.getHours()) + ':' +
                                            pad(dd.getMinutes()) + ':' +
                                            pad(dd.getSeconds())
                if(d < dd){
                    selectOption(te ,plwizaCFG.type)
                    scrollTo(111,1111)
                } else {
                    setTimeout(set_delay ,1024)
                }
            }
            set_delay()
            return
        }
        selectOption(te ,plwizaCFG.type)
        return
    }// select type

    if((te = gi('ctl00_cp_f_cmdDalej'))){// prepare user to autofill the from
        // setup deferred item fill functions and data
        read_xls_data = plVFF ,fill_plwizaform_items = pfd ,define_darr()
        _msg_screen(
"<b>Заполняем форму. Данные (4 первых столбца) скопировать из<br/><u>" +
"<a style='color:blue' href='https://github.com/kobrin13/plwiza.user.js/raw/master/plwiza_form.xlt'>" +
"Excel'а (файл в этой сслыке)</a></u> <b style='color:red'>CTRL+C</b> " +
"вставить здесь <b style='color:red'>CTRL+V</b>:</b><br/>" +
'<textarea id="plvizaformData" onfocus="javascript:this.value=' + "''" +
'" id="ccfgg" style="font-size:8pt;background-color:lightgreen;float:left" ' +
'rows="2" cols="66">Пустой текст покажет Demo заполнения.</textarea>' +
'<input value="Внести данные" onclick="javascript:read_xls_data()" ' +
'type="button" style="font-weight:bold"/><br/>' +
'<span style="font-weight:normal">&nbsp;версия&nbsp;ak:&nbsp;' + ver + '</<span><br/>' +
'время входа на форму: <b>' + (function enter_form_time(d){
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
})(new Date()) + '</b>' +
((te = lost['plwizadate']) ? '<br/>дата визы: <b>' + te + '</b>' : '')
        )

        return
    }

    i = 0, te = gs('a')// this link seems to be very smart
    for(; i < te.length; i++) if(/RejestracjaSchengen/.test(te[i].id)){
        _msg_screen('Переход Шенгенская Виза - Зарегистрируйте бланк')
        te[i].dispatchEvent(mkClick())
        break
    }
}// mainPlwiza()

function plVFF(){// read XLS data into array for deferred item by item filling
try {
    var x = gi("plvizaformData")
        ,rows = x.value.split('\n')
        ,j ,i = 0 // first (zero) line has column headers
        ,demo = !true
        ,el, elId ,v

    if(rows.length < 7) demo = true // demo if text is empty

    _msg_screen('Заполняем.<br/>Демо режим: ' + (demo ? 'да' : 'нет'))

    while(++i < darr.length){ // skip first (zero) line with column headers
        if(!demo){// demo(darr) or XLS data row: [id, ##, name, value]
            v = rows[i].split('\t')
        }
        elId = demo ? darr[i][0] : v[0]// 1st data column -- form IDs
           v = demo ? darr[i][1] : v[3]// 3d  data column -- data
        if(!elId) continue

        if(/^[?]focus/.test(elId)){
            elId = elId.replace(/^.* ([^ ]+$)/g, '$1')// take pure ID of element
            if(!elId) continue

            el = gi(elId)
            if(!el){
                _msg_screen(
"Не найден ?focus элемент! Что-то где-то поменялось. Не могу заполнять.<br/>i=" +
                    i + "; id=" + elId
                )
                continue
            }
            fa.push(elId + " focus")
        } else if(/^[?]check/.test(elId) && v){
            elId = elId.replace(/^.* ([^ ]+$)/g, '$1')
            if(!elId) continue

            el = gi(elId)
            if(!el){
                _msg_screen(
"Не найден ?checkbox элемент! Что-то где-то поменялось. Не могу заполнять.<br/>i=" +
                    i+"; id=" + elId
                )
                continue
            }
            if(v.trim()) fa.push(elId + " check")
        } else if(/^[?]radio/.test(elId) && v){
            elId = v.replace(/^.* ([^ ]+$)/g, '$1')
            if(!elId) continue
            el = gi(elId)
            if(!el){
                _msg_screen(
"Не найден ?radio элемент! Что-то где-то поменялось. Не могу заполнять.<br/>i=" +
                    i + "; id=" + elId
                )
                continue
            }
            fa.push(elId + " radio")
        } else if(!/^[?]/.test(elId) && v){
            //add more "last visas" input fields
            if(/PoprzednieWizy_/.test(elId)){// was RE: _txtDataOd
                el = gi('ctl00_cp_f_btn26Wiecej')
                el.focus()
                el.dispatchEvent(mkClick())
            }
            el = gi(elId)
            if(!el){
                _msg_screen(
"Не найден элемент! Что-то где-то поменялось. Не могу заполнять.<br/>i=" +
                    i + "; id=" + elId
                )
                continue
            }
            if (/_dd/.test(elId) || /s_cb/.test(elId)){ //select
                j = 0
                while(++j < el.options.length) {
                    if (RegExp(v).test(el.options[j].text)) {
                        fa.push(elId + " select " + j)
                        break
                    }
                }
            } else {// simple text
                fa.push([elId + " txt", v])
            }
        }
    }//while
    _msg_screen(
        "Подгрузили. Запускаем заполнялку, задержка = " +
        plwizaCFG.milliSecItem + ' миллисекунд'
    )
    setTimeout(fill_plwizaform_items, plwizaCFG.milliSecItem)
} catch(e){ alert("Случилась херь read_xls_data: " + e) }
}

function pfd(){// pop filled data into form
    var el, s ,d = fa[dataJ]

con.log('d1 = ' + d)

    if(!d || !lost.plwizago) return

    if (typeof d != 'string') {
        s = d[0].split(' ')
    } else {
        s = d.split(' ')
    }

con.log(s)
con.log('d2 = ' + d)

    el = gi(s[0])
    if(!el) return
    el.focus()
    if('txt' == s[1]){
        el.setAttribute("value", d[1]);
        el.value = d[1]
        el.dispatchEvent(mkChange())
    } else if('select' == s[1]){
        el.selectedIndex = parseInt(s[2])
        el.dispatchEvent(mkChange())
    } else if('radio' == s[1]) {
        el.dispatchEvent(mkClick())
    } else if('check' == s[1]) {
        el.dispatchEvent(mkClick())
    } else if('focus' == s[1]){
        fa.splice((dataJ = 0))// cleanup
        return// last form element
    }
    ++dataJ
    setTimeout(fill_plwizaform_items, plwizaCFG.milliSecItem)
}

function define_darr(){
//id array + demo
//sed '/END/q;s/^\([^\t]*\)\t[^\t]*\t[^\t]*\t\(.*\)/["\1","\2"],/;s/[[:blank:]]\{1,\}/ /'
darr = [["id","Значение"],
["ctl00$cp$f$daneOs$txtNazwisko","FAMILIA"],
["ctl00$cp$f$daneOs$txtNazwiskoRodowe","IMIA"],
["ctl00$cp$f$daneOs$txtImiona","OCHESTVO"],
["ctl00$cp$f$daneOs$txtDataUrodzin","1999-11-22"],
["ctl00$cp$f$daneOs$txtMiejsceUrodzenia","DEREVNIA 4i-4i"],
["ctl00$cp$f$daneOs$cbKrajUrodzenia","Б. БЕЛАРУССКАЯ ССР"],
["ctl00$cp$f$daneOs$cbObecneObywatelstwo","БЕЛАРУСЬ"],
["ctl00$cp$f$daneOs$cbPosiadaneObywatelstwo","БЕЛАРУСЬ"],
["?radio","Мужчина ctl00$cp$f$daneOs$rbPlec$0"],
["?radio","Женат/Замужем ctl00$cp$f$daneOs$rbStanCywilny$1"],
["?check ctl00$cp$f$opiekunowie$chkNieDotyczy","да"],
["ctl00$cp$f$txt5NumerDowodu",""],
["?radio","Обычный паспорт       ctl00$cp$f$rbl13$0"],
["ctl00$cp$f$txt14NumerPaszportu","AB1234567"],
["ctl00$cp$f$txt16WydanyDnia","1999-11-22"],
["ctl00$cp$f$txt17WaznyDo","2019-11-22"],
["ctl00$cp$f$txt15WydanyPrzez","A HAC PATb"],
["?пункты",""],
["ctl00$cp$f$ddl45Panstwo","БЕЛАРУСЬ"],
["ctl00$cp$f$txt45StanProwincja","Brest"],
["ctl00$cp$f$txt45Miejscowosc","Chi-Chi"],
["ctl00$cp$f$txt45Kod","220022"],
["ctl00$cp$f$txt45Adres","Bla bla bla"],
["ctl00$cp$f$txt17Email","bill@microsoft.com"],
["ctl00$cp$f$txt46TelefonPrefiks0","001(11)"],
["ctl00$cp$f$txt46TelefonNumer0","23-45-678"],
["?radio","Нет ctl00$cp$f$rbl18$0"],
["?",""],
["ctl00$cp$f$txt18aNumer",""],
["ctl00$cp$f$txt18bDataWaznosci",""],
["?check ctl00$cp$f$chk18Bezterminowo",""],
["ctl00$cp$f$ddl19WykonywanyZawod","Умственный работник"],
["?radio","Работодатель ctl00$cp$f$rbl20$0"],
["ctl00$cp$f$dd20bPanstwo","БЕЛАРУСЬ"],
["ctl00$cp$f$txt20cStanProwincja",""],
["ctl00$cp$f$txt20dMiejscowosc",""],
["ctl00$cp$f$txt20eKodPocztowy",""],
["ctl00$cp$f$txt20fAdres",""],
["ctl00$cp$f$txt20gPrefix",""],
["ctl00$cp$f$txt20hTelefon",""],
["ctl00$cp$f$txt20Nazwa",""],
["ctl00$cp$f$txt20Email",""],
["ctl00$cp$f$txt20PrefiksFax",""],
["ctl00$cp$f$txt20NumerFax",""],
["?",""],
["?check ctl00$cp$f$rbl29$0","да"],
["?check ctl00$cp$f$rbl29$1",""],
["?check ctl00$cp$f$rbl29$2",""],
["?check ctl00$cp$f$rbl29$3","да"],
["?check ctl00$cp$f$rbl29$4",""],
["?check ctl00$cp$f$rbl29$5",""],
["?check ctl00$cp$f$rbl29$6",""],
["?check ctl00$cp$f$rbl29$7",""],
["?check ctl00$cp$f$rbl29$8",""],
["?check ctl00$cp$f$rbl29$9",""],
["?check ctl00$cp$f$rbl29$10","да"],
["ctl00$cp$f$txt29CelPodrozy","badjaga"],
["ctl00$cp$f$ddl21KrajDocelowy","ГЕРМАНИЯ"],
["ctl00$cp$f$ddl23PierwszyWjazd","ПОЛЬША"],
["?radio","Однократного въезда           ctl00$cp$f$rbl24$0"],
["ctl00$cp$f$txt25OkresPobytu",""],
["?radio","Нет ctl00$cp$f$rbl26$0"],
["PoprzednieWizy$0$txtDataOd",""],
["PoprzednieWizy$0$txtDataDo",""],
["PoprzednieWizy$1$txtDataOd",""],
["PoprzednieWizy$1$txtDataDo",""],
["PoprzednieWizy$2$txtDataOd",""],
["PoprzednieWizy$2$txtDataDo",""],
["?radio",""],
["?check ctl00$cp$f$chkNiedotyczy28","не касается"],
["ctl00$cp$f$txt27WydanePrzez",""],
["ctl00$cp$f$txt27WazneOd",""],
["ctl00$cp$f$txt27WazneDo",""],
["ctl00$cp$f$txt30DataWjazdu","2012-05-22"],
["ctl00$cp$f$txt31DataWyjazdu","2012-06-22"],
["?radio","человек ctl00$cp$f$ctrl31_$rbl34$0"],
["ctl00$cp$f$ctrl31_$txt34Nazwa",""],
["ctl00$cp$f$ctrl31_$txt34Imie","Vujtech"],
["ctl00$cp$f$ctrl31_$txt34Nazwisko","Pavlik"],
["ctl00$cp$f$ctrl31_$ddl34panstwo","ЧЕХИЯ"],
["ctl00$cp$f$ctrl31_$txt34miejscowosc",""],
["ctl00$cp$f$ctrl31_$txt34kod",""],
["ctl00$cp$f$ctrl31_$txt34prefikstel",""],
["ctl00$cp$f$ctrl31_$txt34tel",""],
["ctl00$cp$f$ctrl31_$txt34prefiksfax",""],
["ctl00$cp$f$ctrl31_$txt34fax",""],
["ctl00$cp$f$ctrl31_$txt34adres",""],
["ctl00$cp$f$ctrl31_$txt34NumerDomu",""],
["ctl00$cp$f$ctrl31_$txt34NumerLokalu",""],
["ctl00$cp$f$ctrl31_$txt34Email",""],
["?radio","Сам заявитель               ctl00$cp$f$rbl35$0"],
["?check ctl00$cp$f$lbl35a$okreslony$chkWartosc",""],
["?check ctl00$cp$f$lbl35a$inny$chkWartosc",""],
["ctl00$cp$f$txt35KtoPokrywaKoszty",""],
["?",""],
["?check ctl00$cp$f$rb36Gotowka","да"],
["?check ctl00$cp$f$rb36Czeki","да"],
["?check ctl00$cp$f$rb36Karty",""],
["?check ctl00$cp$f$rb36Zakwaterowanie","да"],
["?check ctl00$cp$f$rb36Transport",""],
["?check ctl00$cp$f$rb36PokrywaKoszty",""],
["?check ctl00$cp$f$rb36Inne","да"],
["ctl00$cp$f$txt36Inne","penize"],
["?check ctl00$cp$f$rb36Ubezpieczenie","да"],
["ctl00$cp$f$txt36WazneDo","2012-11-11"],
["?check ctl00$cp$f$chkNieDotyczy43","не касается"],
["ctl00$cp$f$txt43Nazwisko",""],
["ctl00$cp$f$txt43Imie",""],
["ctl00$cp$f$txt43DataUrodzenia",""],
["ctl00$cp$f$txt43Paszport",""],
["ctl00$cp$f$ddl43Obywatelstwo",""],
["?radio",""],
["?",""],
["?check ctl00$cp$f$chk44Oswiadczenie1","да"],
["?check ctl00$cp$f$chk44Oswiadczenie2","да"],
["?check ctl00$cp$f$chk44Oswiadczenie3","да"],
["?focus ctl00$cp$f$cmdDalej",""]]
}
})(window ,document ,localStorage ,alert ,setTimeout ,console ? console : function(){})

//kobrin13: ak.js ends here
