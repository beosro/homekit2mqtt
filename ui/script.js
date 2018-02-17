/* global $, document, window, location, template */

let services = {};
let config = {};
let topics = [];

$(document).ready(() => {
    const $selectService = $('#selectService');
    const $dialogService = $('#dialogService');
    const $dialogConfig = $('#dialogConfig');
    const $dialogConfirmDel = $('#dialogConfirmDel');
    const $next = $('#next');

    const $service = $('#service');
    const $id = $('#id');
    const $name = $('#name');
    const $nameAcc = $('#nameAcc');

    const $idAcc = $('#idAcc');
    const $idAccessory = $('#idAccessory');
    const $indexService = $('#indexService');

    const $serviceConfirm = $('#serviceConfirm');
    const $nameConfirm = $('#nameConfirm');

    const $configuration = $('#configuration');

    $.get('/topics', body => {
        topics = JSON.parse(body);
    });

    function subGrid(idSubgrid, idRow) {
        const data = [];
        config[idRow].services.forEach((service, id) => {
            data.push({id, name: service.name, service: service.service});
        });
        const idSubGridTable = 'subgrid_' + idRow + '_t';
        $('[id="' + idSubgrid + '"]').html('<table id=\'' + idSubGridTable + '\' class=\'scroll\'></table>');
        $('[id="' + idSubGridTable + '"]').jqGrid({
            cmTemplate: {autoResizable: true},
            autowidth: true,
            width: '100%',
            guiStyle: 'bootstrap',
            hidegrid: false,
            iconSet: 'fontAwesome',

            data,

            colNames: ['Name', 'Service', ''],
            colModel: [
                {name: 'name', index: 'name'},
                {name: 'service', index: 'service'},
                {
                    name: 'act',
                    template: 'actions',
                    formatoptions: {
                        editbutton: false,
                        delbutton: false
                    },
                    width: 72,
                    align: 'right'
                }
            ],
            actionsNavOptions: {
                editServiceicon: 'fa-pencil',
                editServicetitle: 'Edit Service',
                deleteServiceicon: 'fa-trash',
                deleteServicetitle: 'Delete Service',
                custom: [
                    {
                        action: 'editService',
                        position: 'first',
                        onClick(options) {
                            console.log('edit', idRow, options.rowid);
                            edit(idRow, options.rowid);
                        }
                    },
                    {
                        action: 'deleteService',
                        position: 'first',
                        onClick(options) {
                            $idAccessory.val(idRow);
                            $indexService.val(options.rowid);
                            $('#accNameConfirm').html(config[idRow].name);
                            $nameConfirm.val(config[idRow].services[options.rowid].name);
                            $serviceConfirm.val(config[idRow].services[options.rowid].service);
                            $('#dialogConfirmDel').modal();
                        }
                    }
                ]
            }
        });
    }

    function addService(id) {
        $idAccessory.val(id);
        $indexService.val(config[id].services.length);
        createTemplate($selectService.val());
        $dialogService.modal();
    }

    const $gridServices = $('#gridServices');

    $gridServices.jqGrid({
        cmTemplate: {autoResizable: true},
        autowidth: true,
        width: '100%',
        caption: 'homekit2mqtt',
        guiStyle: 'bootstrap',
        hidegrid: false,
        iconSet: 'fontAwesome',

        subGrid: true,

        subGridRowExpanded: subGrid,

        colNames: ['id', 'name', 'services', ''],
        colModel: [
            {
                name: 'id',
                index: 'id'
            },
            {
                name: 'name',
                index: 'name'
            },
            {
                name: 'numServices',
                index: 'numServices'
            },
            {
                name: 'act',
                template: 'actions',
                formatoptions: {
                    editbutton: false,
                    delbutton: false
                },
                width: 82,
                align: 'right'

            }
        ],
        actionsNavOptions: {
            deleteAccessoryicon: 'fa-trash',
            deleteAccessorytitle: 'Delete Accessory',
            editAccessoryicon: 'fa-pencil',
            editAccessorytitle: 'Edit Accessory',
            addServiceicon: 'fa-plus-square',
            addServicetitle: 'Add Service',
            custom: [
                {
                    action: 'addService',
                    position: 'first',
                    onClick(options) {
                        addService(options.rowid);
                    }
                },
                {action: 'editAccessory', position: 'first', onClick(options) {
                    editAcc(options.rowid);
                }},
                {
                    action: 'deleteAccessory',
                    position: 'first',
                    onClick(options) {
                        $('#nameConfirmAcc').val(config[options.rowid].name);
                        $('#idConfirmAcc').val(options.rowid);
                        $('#dialogConfirmDelAcc').modal();
                    }
                }
            ]
        },

        data: [],
        rowList: [25, 100, '10000:All'],
        rowNum: 10000,
        viewrecords: true,
        pager: true,

        loadComplete() {
            $('#edit, #del').attr('disabled', true);
        },

        beforeSelectRow(rowid) {
            return ($(this).getGridParam('selrow') !== rowid);
        }

    }).jqGrid('navGrid', {
        add: false,
        edit: false,
        del: false,
        search: false,
        refresh: false
    }).jqGrid('navButtonAdd', {
        caption: 'Add',
        buttonicon: 'fa-plus-square',
        title: 'Add accessory',
        id: 'addAcc'
    }).jqGrid('navButtonAdd', {
        caption: 'Stop',
        buttonicon: 'fa-stop-circle-o',
        title: 'Stop homekit2mqtt',
        id: 'stop'
    })
        .jqGrid('filterToolbar', {defaultSearch: 'cn', ignoreCase: true, searchOnEnter: false})
        .jqGrid('gridResize');

    $.get('/config', body => {
        config = JSON.parse(body);
        loadConfig();
    });

    const $addAcc = $('#addAcc');
    const $stop = $('#stop');

    function loadConfig() {
        Object.keys(config).forEach(id => {
            $gridServices.jqGrid('addRowData', id, {
                id,
                name: config[id].name,
                numServices: config[id].services.length
            });
        });
        $gridServices.jqGrid('sortGrid', 'name', true, 'asc');
    }

    $.get('/services.json', body => {
        services = body;
        Object.keys(services).forEach(service => {
            $selectService.append('<option>' + service + '</option>');
        });

        $selectService.change(function () {
            createTemplate($(this).val());
        });
    });

    function createTemplate(s) {
        console.log(s);
        $('#selectTemplate').html('<option>none</option>');
        $('#selectTemplate').val('none');
        $('.name-template, .select-template').hide();
        if (template[s]) {
            $('.select-template').show();
            Object.keys(template[s]).forEach(t => {
                $('#selectTemplate').append('<option>' + t + '</option>');
            });
            $('#selectTemplate').change(function () {
                if ($(this).val() === 'none') {
                    $('.name-template').hide();
                } else {
                    $('.name-template').show();
                }
            });
        }
    }

    $addAcc.click(() => {
        $idAcc.removeAttr('disabled').val('');
        $nameAcc.val('');
        $('#manufacturer').val('');
        $('#serial').val('');
        $('#model').val('');
        $('#dialogAccessory').modal();
    });

    $('#deleteAcc').click(() => {
        delete config[$('#idConfirmAcc').val()];
        $gridServices.jqGrid('delRowData', $('#idConfirmAcc').val());
        $('#dialogConfirmDelAcc').modal('hide');
        $.ajax({
            url: '/config',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(config)
        });
    });

    $next.click(() => {
        $dialogService.modal('hide');
        $id.removeAttr('disabled');
        createServiceForm($selectService.val());
        if ($('#selectTemplate').val() !== 'none') {
            const tpl = template[$selectService.val()][$('#selectTemplate').val()];
            const name = $('#nameTemplate').val();
            $id.val(tplReplace(tpl.id, name));
            $name.val(tplReplace(tpl.name, name));
            $('#model').val(tplReplace(tpl.model, name));
            $('#manufacturer').val(tplReplace(tpl.manufacturer, name));
            Object.keys(tpl.topic).forEach(t => {
                $('#topic-' + t).val(tplReplace(tpl.topic[t], name));
            });
            Object.keys(tpl.payload).forEach(p => {
                const val = tpl.payload[p];
                console.log(p, val, typeof val);
                switch (typeof val) {
                    case 'number':
                        $('#payload-type-' + p).val('Number').trigger('change');
                        $('#payload-number-' + p).val(val);
                        break;
                    case 'string':
                        $('#payload-type-' + p).val('String').trigger('change');
                        $('#payload-string-' + p).val(val);
                        break;
                    case 'boolean':
                        $('#payload-type-' + p).val('Boolean').trigger('change');
                        $('#payload-boolean-' + p).val(String(val));
                        break;
                    default:
                }
            });
        }
        $dialogConfig.modal();
    });

    function tplReplace(val, name) {
        return val.replace(/%name%/g, name);
    }

    $('#delete').click(() => {
        const idAcc = $idAccessory.val();
        const indexService = parseInt($indexService.val(), 10);
        console.log('delete', idAcc, indexService);
        config[idAcc].services.splice(indexService, 1);
        $gridServices.jqGrid('collapseSubGridRow', idAcc);
        $gridServices.jqGrid('expandSubGridRow', idAcc);
        $gridServices.jqGrid('setRowData', idAcc, {
            numServices: config[idAcc].services.length
        });

        $.ajax({
            url: '/config',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(config)
        });
        $dialogConfirmDel.modal('hide');
    });

    $stop.click(() => {
        alert('stop')
        $.get('/quit');
        setTimeout(() => {
            location.reload();
        }, 3000);
    });

    $('#saveAcc').click(() => {
        if (validateAcc()) {
            const id = $.trim($idAcc.val());
            const result = {
                id,
                name: $.trim($nameAcc.val()),
                manufacturer: $.trim($('#manufacturer').val()),
                model: $.trim($('#model').val()),
                serial: $.trim($('#serial').val())
            };

            if (!config[id]) {
                config[id] = {};
            }

            $.extend(config[id], result);

            if (!config[id].services) {
                config[id].services = [];
            }
            if (config[id].serial === '') {
                delete config[id].serial;
            }
            if (config[id].model === '') {
                delete config[id].model;
            }
            if (config[id].manufacturer === '') {
                delete config[id].manufacturer;
            }

            $('#dialogAccessory').modal('hide');

            if ($idAcc.attr('disabled')) {
                // Existing Accessory
                $gridServices.jqGrid('setRowData', id, {
                    name: config[id].name
                });
            } else {
                // New Accessory
                $gridServices.jqGrid('addRowData', id, {
                    id,
                    name: config[id].name,
                    numServices: 0
                });
                addService(id);
                $gridServices.trigger('reloadGrid').jqGrid('sortGrid', 'name', true, 'asc');
                $gridServices.jqGrid('setSelection', id, true);
                $('#gridServices [id="' + id + '"]').focus();
            }

            $.ajax({
                url: '/config',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(config)
            });
        }
    });

    $('#save').click(() => {
        if (validate()) {
            const service = $service.val();
            const result = {
                name: $.trim($name.val()),
                service,
                topic: {},
                payload: {},
                config: {},
                props: {}
            };

            const s = services[service];

            if (s.topic) {
                s.topic.forEach(topic => {
                    const val = $.trim($('#topic-' + topic.name).val());
                    result.topic[topic.name] = val;
                });
            }
            if (s.payload) {
                s.payload.forEach(payload => {
                    const type = $('#payload-type-' + payload.name).val();
                    let val;
                    switch (type) {
                        case 'Undefined':
                            val = undefined;
                            break;
                        case 'Number':
                            val = parseFloat($('#payload-number-' + payload.name).val());
                            break;
                        case 'Boolean':
                            val = $('#payload-boolean-' + payload.name).val() === 'true';
                            break;
                        case 'String':
                            val = $('#payload-string-' + payload.name).val();
                            break;
                        default:
                    }
                    if (typeof val !== 'undefined') {
                        result.payload[payload.name] = val;
                    }
                });
            }

            if (s.config) {
                s.config.forEach(c => {
                    result.config[c.name] = parseInt($.trim($('#config-' + c.name).val()), 10);
                });
            }

            if (s.props) {
                s.props.forEach(p => {
                    result.props[p.name] = {};
                    if (typeof p.minValue !== 'undefined') {
                        result.props[p.name].minValue = parseFloat($(`#config-${p.name}-minValue`).val());
                    }
                    if (typeof p.maxValue !== 'undefined') {
                        result.props[p.name].maxValue = parseFloat($(`#config-${p.name}-maxValue`).val());
                    }
                    if (typeof p.validValues !== 'undefined') {
                        result.props[p.name].validValues = [];
                        for (let i = 0; i < p.validValues.length; i++) {
                            if ($(`#config-${p.name}-validValues-${i}`).is(':checked')) {
                                result.props[p.name].validValues.push(i);
                            }
                        }
                    }
                });
            }

            const index = parseInt($indexService.val(), 10);
            const idAcc = $idAccessory.val();

            config[idAcc].services[index] = result;

            $.ajax({
                url: '/config',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(config)
            });

            $gridServices.jqGrid('collapseSubGridRow', idAcc);
            $gridServices.jqGrid('expandSubGridRow', idAcc);

            $gridServices.jqGrid('setRowData', idAcc, {
                numServices: config[idAcc].services.length
            });

            $dialogConfig.modal('hide');
        }
    });

    function editAcc(id) {
        $idAcc.attr('disabled', true);
        $idAcc.val(id);
        $nameAcc.val(config[id].name);
        $('#manufacturer').val(config[id].manufacturer || '');
        $('#model').val(config[id].model || '');
        $('#serial').val(config[id].serial || '');
        $('#dialogAccessory').modal();
    }

    function edit(acc, id) {
        console.log(acc, id);
        $indexService.val(id);
        $idAccessory.val(acc);
        const s = config[acc].services[id];
        console.log(s);
        createServiceForm(s.service);

        $id.attr('disabled', true);
        $id.val(id);
        $selectService.val(s.service);
        $name.val(s.name);

        if (s.topic) {
            Object.keys(s.topic).forEach(topic => {
                if (typeof s.topic[topic] !== 'undefined') {
                    $('#topic-' + topic).val(s.topic[topic]);
                }
            });
        }

        if (s.payload) {
            Object.keys(s.payload).forEach(payload => {
                switch (typeof s.payload[payload]) {
                    case 'boolean':
                        $('#payload-boolean-' + payload).val(String(Boolean(s.payload[payload])));
                        $('#payload-type-' + payload).val('Boolean').trigger('change');
                        break;
                    case 'number':
                        $('#payload-number-' + payload).val(s.payload[payload]);
                        $('#payload-type-' + payload).val('Number').trigger('change');

                        break;
                    default:
                        $('#payload-string-' + payload).val(s.payload[payload]);
                        $('#payload-type-' + payload).val('String').trigger('change');
                }
            });
        }

        if (s.config) {
            Object.keys(s.config).forEach(c => {
                if (typeof s.config[c] !== 'undefined') {
                    $('#config-' + c).val(s.config[c]);
                }
            });
        }

        if (s.props) {
            Object.keys(s.props).forEach(p => {
                const obj = s.props[p];
                if (typeof obj.minValue !== 'undefined') {
                    $(`#config-${p}-minValue`).val(obj.minValue);
                }
                if (typeof obj.maxValue !== 'undefined') {
                    $(`#config-${p}-maxValue`).val(obj.maxValue);
                }
                if (typeof obj.validValues !== 'undefined') {
                    $(`[id^=config-${p}-validValues-]`).each(function () {
                        if (obj.validValues.indexOf(parseInt($(this).val(), 10)) === -1) {
                            $(this).removeAttr('checked');
                        } else {
                            $(this).attr('checked', true);
                        }
                    });
                }
            });
        }

        $('#manufacturer').val(s.manufacturer);
        $('#model').val(s.model);
        $('#serial').val(s.serial);

        $dialogConfig.modal({
            backdrop: 'static'
        });
    }

    function validateAcc() {
        let valid = true;
        const idAcc = $.trim($idAcc.val());
        const name = $.trim($nameAcc.val());
        if ($idAcc.attr('disabled')) {
            $idAcc.removeClass('is-invalid');
            Object.keys(config).forEach(i => {
                if (name === '' || (config[i].name === name && config[i].name !== config[idAcc].name)) {
                    $nameAcc.addClass('is-invalid');
                    valid = false;
                }
            });
        } else {
            if (config[idAcc] || idAcc === '') {
                $idAcc.addClass('is-invalid');
                valid = false;
            } else {
                $idAcc.removeClass('is-invalid');
            }
            $nameAcc.removeClass('is-invalid');
            Object.keys(config).forEach(i => {
                if (name === '' || config[i].name === name) {
                    $nameAcc.addClass('is-invalid');
                    valid = false;
                }
            });
        }
        return valid;
    }

    function validate() {
        const name = $.trim($name.val());
        if (name) {
            $name.removeClass('is-invalid');
            return true;
        }
        $name.addClass('is-invalid');
        return false;
    }

    function createServiceForm(service) {
        $id.val('');
        $name.val('');
        $('#manufacturer').val('');
        $('#model').val('');
        $('#serial').val('');

        const s = services[service];
        $service.val(service);
        $configuration.html('<h4>MQTT Topics</h4>');

        s.topic.forEach(t => {
            $configuration.append(`
               <div class="form-group row">
                   <label for="topic-${t.name}" class="col-sm-4 col-form-label">${t.name}</label>
                   <div class="col-sm-8">
                       <input type="text" class="form-control topic" id="topic-${t.name}" data-topic="${t.name}" autocomplete="off">
                   </div>
               </div>`);
        });

        $('input.topic').each(function () {
            $(this).typeahead({source: topics});
        });

        if (s.payload && s.payload.length > 0) {
            $configuration.append('<h4>MQTT Payloads</h4>');
            s.payload.forEach(p => {
                $configuration.append(`
                   <div class="form-group row">
                       <label for="payload-${p.name}" class="col-sm-4 col-form-label">${p.name}</label>
                       <div id="payload-input-${p.name}" class="col-sm-8"></div>
                   </div>`);
                createPayloadInput(p, $('#payload-input-' + p.name));
            });
        }

        if (s.config && s.config.length > 0) {
            $configuration.append('<h4>Configuration</h4>');
            s.config.forEach(c => {
                $configuration.append(`
                   <div class="form-group row">
                       <label for="config-${c.name}" class="col-sm-4 col-form-label">${c.name}</label>
                       <div id="config-input-${c.name}" class="col-sm-8"></div>
                   </div>`);
                createConfigInput(c, $('#config-input-' + c.name));
            });
        }

        if (s.props && s.props.length > 0) {
            $configuration.append('<h4>Properties</h4>');
            s.props.forEach(p => {
                $configuration.append(`<h5>${p.name}</h5>`);

                if (typeof p.minValue !== 'undefined') {
                    $configuration.append(`
                   <div class="form-group row">
                       <label for="config-input-${p.name}-minValue" class="col-sm-4 col-form-label">minValue</label>
                       <div id="config-input-${p.name}-minValue" class="col-sm-8">
                           <input id="config-${p.name}-minValue" class="config-props form-control" type="number" value="${p.minValue}">
                       </div>
                   </div>`);
                }

                if (typeof p.maxValue !== 'undefined') {
                    $configuration.append(`
                   <div class="form-group row">
                       <label for="config-input-${p.name}-maxValue" class="col-sm-4 col-form-label">maxValue</label>
                       <div id="config-input-${p.name}-maxValue" class="col-sm-8">
                           <input id="config-${p.name}-maxValue" class="config-props form-control" type="number" value="${p.maxValue}">
                       </div>
                   </div>`);
                }

                if (typeof p.validValues !== 'undefined') {
                    let row = `<div class="form-group row">
                       <label for="config-input-${p.name}-validValues" class="col-sm-4 col-form-label">validValues</label>
                       <div id="config-input-${p.name}-validValues" class="col-sm-8">`;

                    p.validValues.forEach((v, i) => {
                        row += `<div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="config-${p.name}-validValues-${i}" value="${i}" checked>
                            <label class="form-check-label" for="config-${p.name}-validValues-${i}">${v}</label></div>`;
                    });

                    row += `</div></div>`;
                    $configuration.append(row);
                }
            });
        }
    }

    function createConfigInput(c, $elem) {
        let html = '<div>';
        if (c.enum) {
            html += `<select id="config-${c.name}" class="config-enum form-control">`;
            c.enum.forEach((o, i) => {
                html += `<option value="${i}">${o}</option>`;
            });
            html += '</select>';
        }
        html += '</div>';
        $elem.append(html);
    }

    function createPayloadInput(p, $elem) {
        const html = `<div class="input-group">
      <span class="input-group-addon">
        <select id="payload-type-${p.name}" data-payload="${p.name}" class="payload-type form-control" ${p.type ? 'disabled' : ''}>
          <option>Undefined</option>
          <option ${p.type === 'Number' ? 'selected' : ''}>Number</option>
          <option ${p.type === 'Boolean' ? 'selected' : ''}>Boolean</option>
          <option ${p.type === 'String' ? 'selected' : ''}>String</option>
        </select>
      </span>
      <input id="payload-undefined-${p.name}" data-payload="${p.name}" type="string" class="form-control payload Undefined" disabled>
      <input id="payload-number-${p.name}" data-payload="${p.name}" type="number" class="form-control payload Number">
      <input id="payload-string-${p.name}" data-payload="${p.name}" type="text" class="form-control payload String">
      <select id="payload-boolean-${p.name}" data-payload="${p.name}" class="form-control payload Boolean">
          <option value="false">False</option>
          <option value="true">True</option>
      </select>
    </div>`;
        $elem.append(html);
        const $type = $('#payload-type-' + p.name);
        $type.change(changeType);
        changeType();

        function changeType() {
            $elem.find('.payload').hide();
            $elem.find('.payload.' + $type.val()).show();
        }
    }

    resizeGrid();
    $(window).resize(resizeGrid);

    function resizeGrid() {
        const height = $(window).height() - 128;
        const width = $(window).width() - 14;
        $gridServices
            .jqGrid('setGridWidth', width)
            .jqGrid('setGridHeight', height)
            .jqGrid('gridResize');
    }
});

