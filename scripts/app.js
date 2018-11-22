// Copyright 2016 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/*
*   TODO
*/


jQuery(document).ready(function() {
    function header()
    {
        header_height = $(".header").height() + 10;
        $(".main").css("padding-top", header_height);
    }
    header();
    $(window).resize(function()
    {
        header();
    });


    (function() {
        'use strict';
        init();

        let idCounter = 10;

        let app = {
            menuState: 1,
            isLoading: true,
            savedTasks: [],
            card: $('.card'),
            spinner: $('.loader'),
            cardTemplate: $('#liTemplate').html(),
            emptyTemplate: $('#emptyTemplate').html(),
            optionsTemplate: $('#ItemOptionsTemplate').html(),
            container: $('.main'),
            addDialog: $('.dialog-container'),
        };

        /*clear the DB - duh*/
        app.clearTheDB = function clearDB()
        {
            console.log('IndexedDB Cleared');
        }

        /*Render empty template displaying empty screen and message*/
        app.renderEmpty = function()
        {
            if (!$('.messageContainer').length && !$('.taskListItem').length)
            {
                const message = {message: "It seems you have <wbr> nothing to do... <br> lucky you"};
                app.container.removeAttr('hidden');
                app.container.append(Mustache.render(app.emptyTemplate,message));

                if (app.isLoading) {
                    app.spinner.attr('hidden', true);
                    app.container.removeAttr('hidden');
                    app.isLoading = false;
                }
            }

        }

        app.counter = function()
        {
            localforage.length().then(function(numberOfKeys)
            {
                // Outputs the length of the database.
                localforage.key(numberOfKeys-1).then(function(value)
                {
                    let sd = value.match(/\d+/);
                    sd = parseInt(sd[0]);
                    let latestKey = sd;
                    idCounter = latestKey + 1;
                }).catch(function(err)
                {
                    // This code runs if there were any errors
                    console.log(err);
                });
            }).catch(function(err)
            {
                // This code runs if there were any errors
                console.log(err);
            });
        }

        function init()
        {
            localforage.startsWith('task').then(function(value)
            {
                if (value == null)
                {
                    app.renderEmpty();
                }
                else
                {
                    app.counter();
                    app.getTasks();

                    if (app.isLoading) {
                        app.spinner.attr('hidden', true);
                        app.container.removeAttr('hidden');
                        app.isLoading = false;
                    }
                }
            }).catch(function(err)
            {
                console.error(err);
            });
        }

        app.setCounter = function() {
            if(idCounter > 0){
                let keyVal = 'task_' + idCounter;
            }
            idCounter++;
            return keyVal;
        }

        /*add task and show on screen, call savetask to save to indexedDB. Also remove the emptyscreen*/
        app.addTask = function(taskInput)
        {
            const counter = app.setCounter();
            const task = {task: taskInput, id: counter};
            console.log(task);
            app.card.removeAttr('hidden');
            $('#listContainer').append(Mustache.render(app.cardTemplate,task));
            app.savedTask = {task: taskInput, taskStatus: 'unfinished'};
            app.saveTask(counter);
            $('.messageContainer').remove();
        }

        /*****************************************************************************
         *
         * Event listeners for UI elements
         *
         ****************************************************************************/
        /*event handler for textbox and button. calls addtask to add a task. Returns false to prevent form submission*/
        $('#butAdd').click(function()
        {
            let taskInput = $('#taskInput').val();
            taskInput = taskInput.trim();
            console.log(taskInput);
            if (taskInput != '')
            {
                app.addTask(taskInput);
                $('#taskInput').val('');
            }

            return false;
        });

        $('#butDelete').click(function()
        {
            app.deleteFinishedTasks();
            return false;
        });

//click outside menu hides menu
        $(document).on("click", $(document), function(event)
        {
            let target = event.target; //target div recorded
            if (!$(target).is('.itemOption') )
            {
                app.hideMenu();
            }
        });

        $('#listContainer').on("click","#butItemOptions",function(event)
        {
            switch(app.menuState){
                case 1 :
                case undefined :
                    app.showMenu(event);
                    break;
                case 2 :
                    app.hideMenu();
                    break;
            }
            return false;

        });

        /*Remove item eventhandler*/
        $('#listContainer').on("click", ".itemOptionDelete", function(event)
        {
            const deleteButton = event.target;
            const deleteButtonParentID = $(deleteButton).closest('.taskListItem').attr('id');
            localforage.removeItem(deleteButtonParentID).then(function(results)
            {
                console.log('Item Removed');
            }).catch(function(err)
            {
                console.error(err);
            });
            $('#' + deleteButtonParentID).remove();
            app.counter();
            app.renderEmpty();
        });

        $('#listContainer').on("click", ".itemOptionEdit", function(event)
        {
            const editButton = event.target;
            const editButtonParent = $(editButton).closest('.taskListItem');
            app.editTask(editButtonParent);
            app.hideMenu();
        });

        $('#listContainer').on("click", "#taskMessage", function(event)
        {
            console.log('clickedy click');
            const editButton = event.target;
            const editButtonParent = $(editButton).closest('.taskListItem');
            app.editTask(editButtonParent);
        });

        /*Eventhandler for checkbox. toggles between on and off and gets the triggered checkbox parent to change its colour.
        if it is changed it will change the task status to unfinished or finished*/
        $(document).on("change",".checkboxDone",function(event){
            if ($(this).prop('checked'))
            {
                const checkbox = event.target;
                const parentListItem = $(checkbox).parent();
                const parentListItemValue = parentListItem.attr('id');
                console.log(parentListItemValue);

                app.setTaskStatus(parentListItemValue, parentListItem);
            }
            else
            {
                const checkbox = event.target;
                const parentListItem = $(checkbox).parent();
                const parentListItemValue = parentListItem.attr('id');
                console.log(parentListItemValue);
                app.setTaskStatus(parentListItemValue, parentListItem);
            }
        });
        /*
                            END Eventlistener
        */

        app.showMenu = function(event)
        {
            console.log('show menu');
            app.showItemOptions(event);
            app.menuState = 2;
        }

        app.hideMenu = function()
        {
            $('.ItemOptionsMenuContainer').remove();
            app.menuState = 1;
        }

        app.saveTask = function(counter)
        {
            localforage.setItem(counter, app.savedTask).then(function()
            {
                app.savedTasks.length = 0;
                return localforage.getItem('task');
            }).then(function (value)
            {
                console.log('set');
            }).catch(function (err)
            {
                console.error(err);
            });
        }

        app.editTask = function(editButtonParent)
        {
            const taskID = $(editButtonParent).attr('id');
            localforage.getItem(taskID).then(function(item)
            {
                console.log(item);
                console.log(editButtonParent);
                let taskStatus = item.taskStatus;
                let obj = $(editButtonParent).find('p');
                let id = $(obj).attr('id');
                let editingID = id.replace('taskMessage', 'taskMessage_editing');
                let inputContainer = $('<div />', {'class': 'editContainer'});
                let input = $('<input />', { 'type': 'text', 'id': editingID, 'class': 'editBox', 'value': $(obj).html().trim() });
                $(obj).after(inputContainer);
                $(inputContainer).append(input);
                $(obj).remove();
                input.focus();
                input.blur(function()
                {

                    let obj = $('.editBox');
                    let id = $(obj).attr('id');
                    let value = $(obj).val();
                    let task = {task: value, taskStatus: taskStatus};
                    let editingID = id.replace('taskMessage_editing', 'taskMessage');
                    let input = $('<p />', { 'id': editingID, 'html': value });
                    localforage.setItem(taskID, task );
                    $(inputContainer).parent().find('.checkboxDone').before(input);
                    $(obj).remove();
                    $(inputContainer).remove();
                });

            });
        }

        app.renderTasks = function(results)
        {
            console.log(results);

            $.each(results, function(key, value)
            {
                console.log(key, value);
                app.card.removeAttr('hidden');
                $('#listContainer').append(Mustache.render(app.cardTemplate,{task: value.task, id: key}));
                if (value.taskStatus == 'finished')
                {
                    $('#' + key).find('input').attr('checked', true);
                    $('#' + key).css('background-color', '#dedddd');
                }
            });
        }

        app.showItemOptions = function(event)
        {
            const target = event.target;
            const containerListItem = $(target).next();
            $(containerListItem).append(Mustache.render(app.optionsTemplate));
            if(!$('.ItemOptionsMenuContainer').visible(false, false))
            {
                const menu_height = $('.ItemOptionsMenuContainer').closest('.taskListItem').outerHeight();
                $('.ItemOptionsMenuContainer').css({'top': 'auto'});
                $('.ItemOptionsMenuContainer').css({'bottom': menu_height});
            }
        }

        app.getTasks = function()
        {
            localforage.getItems().then(function(results)
            {
                if($.isEmptyObject(results))
                {
                    app.renderEmpty();
                }
                else
                {
                    app.renderTasks(results);
                }
            }).catch(function(err)
            {
                console.error(err);
            });
        }

        app.setTaskStatus = function(parentListItemValue,parentListItem)
        {
            localforage.getItem(parentListItemValue).then(function(result)
            {
                console.log(parentListItemValue);
                console.log(result);
                if (result.taskStatus == 'unfinished')
                {
                    result.taskStatus = 'finished';
                    parentListItem.css('background-color', '#dedddd');
                }
                else if (result.taskStatus == 'finished')
                {
                    result.taskStatus = 'unfinished';
                    parentListItem.css('background-color', '#ccc');
                }
                localforage.setItem(parentListItemValue, result).then(function()
                {
                    console.log('Task status changed');
                }).catch(function(err)
                {
                    console.error(err);
                });

            }).catch(function(err)
            {
                console.error(err);
            });

        }

        app.deleteFinishedTasks = function()
        {
            localforage.getItems().then(function(results)
            {
                if($.isEmptyObject(results))
                {
                    app.renderEmpty();
                }
                else
                {
                    $.each(results, function(key, value)
                    {
                        console.log(key, value);
                        //app.card.removeAttr('hidden');
                        //$('#listContainer').append(Mustache.render(app.cardTemplate,{task: value.task, id: key}));
                        if (value.taskStatus == 'finished')
                        {
                            localforage.removeItem(key).then(function(results)
                            {
                                console.log('Item Removed');
                            }).catch(function(err)
                            {
                                console.error(err);
                            });

                            //$('#' + key).find('input').attr('checked', true);
                            $('#' + key).remove();
                        }
                    });
                    app.counter();
                    app.renderEmpty();
                }
            }).catch(function(err)
            {
                console.error(err);
            });
        }

// TODO add service worker code here
// if ('serviceWorker' in navigator)
// {
//     navigator.serviceWorker
//              .register('./service-worker.js')
//              .then(function()
//              {
//                 console.log('Service Worker Registered');
//             });
// }

        function registerServiceWorker()
        {
            return navigator.serviceWorker.register('./service-worker.js').then(function(registration)
            {
                console.log('Service worker successfully registered.');
                return registration;
            })
                .catch(function(err)
                {
                    console.error('Unable to register service worker.', err);
                });
        }

        registerServiceWorker();

    })();

});