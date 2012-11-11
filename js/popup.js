define(["jquery", "jmousewheel", "jscrollpane"], function ($) {
    (function ($) {
        var popup = null;
        var methods = {
            init: function(options) {
                if(typeof(options.backgroundColor) !== 'undefined'){
                    popup.setBackgroundColor(options.backgroundColor);
                }

                if(typeof(options.fontColor) !== 'undefined'){
                    popup.setFontColor(options.fontColor);
                }

                if(typeof(options.borderColor) !== 'undefined'){
                    popup.setBorderColor(options.borderColor);
                }

                if(typeof(options.disableHeader) !== 'undefined'){
                    popup.disableHeader();
                }

                popup.addMenu(options.id, options.title, options.contents);
            },
            popupInit: function(options) {
                popup = new Popup(this.selector);
                methods.init(options);
            },
            optionsPopupInit: function (options) {
                popup = new OptionsPopup(this.selector);

                if(typeof(options.disableBackButton) !== 'undefined'){
                    popup.disableBackButton();
                }

                methods.init(options);
            },
            lockPopup: function() {
                popup.lockPopup();
            },
            unlockPopup: function() {
                popup.unlockPopup();
            },
            disableHeader: function() {
                popup.disableHeader();
            },
            addMenu: function (menu) {
                if (popup === null)return;
                popup.addMenu(menu.id, menu.title, menu.contents);
            },
            closePopup: function () {
                popup.closePopup();
            }
        };

        $.fn.optionsPopup = function (method) {
            // Create some defaults, extending them with any options that were provided
            //var settings = $.extend({}, options);
            // Method calling logic
            if (methods[method]) {
                return methods[ method ].apply(this, Array.prototype.slice.call(arguments, 1));
            } else if (typeof method === 'object' || !method) {
                return methods.optionsPopupInit.apply(this, arguments);
            } else {
                $.error('Method ' + method + ' does not exist on jQuery.popup');
            }

            return this.each(function () {
            });
        };

        $.fn.popup = function (method) {
            // Create some defaults, extending them with any options that were provided
            //var settings = $.extend({}, options);
            // Method calling logic
            if (methods[method]) {
                return methods[ method ].apply(this, Array.prototype.slice.call(arguments, 1));
            } else if (typeof method === 'object' || !method) {
                return methods.popupInit.apply(this, arguments);
            } else {
                $.error('Method ' + method + ' does not exist on jQuery.popup');
            }

            return this.each(function () {
            });
        }
    })(jQuery);

    /** Popup Constructor **/

    var lastElementClick = null;
    var history = [];
    function Popup(popupListener) {
        var currentTarget = null;

        var thisPopup = this;
        var title = "";
        var content = "";
        var menus = [];
        var backgroundColor = null;
        var fontColor = null;
        var borderColor = null;

        var padding = 3;
        var offScreen = false;

        var isLocked = false;
        var isHeaderDisabled = false;

        if ((typeof(popupListener) === 'undefined') || popupListener === null) {
            console.log("ERROR: No listener passed!");
            return;
        }
        var listenerElements = $(popupListener);

        //Class added to detect clicks on primary buttons triggering popups.
        listenerElements.addClass("popupListener");

        listenerElements.css("cursor", "pointer");
        listenerElements.click(function (e) {
            thisPopup.toggleVisible(e, $(this));
        });

        this.setBackgroundColor = function(color){
            backgroundColor = color;
        };

        this.setFontColor = function(color){
            fontColor = color;
        };

        this.setBorderColor = function(color){
            borderColor = color;
        };

        this.lockPopup = function(){
            isLocked = true;
        };

        this.unlockPopup = function(){
            isLocked = false;
        };

        this.disableHeader = function() {
            $("#popupHeader").hide();

            //TODO: Move into navigator? Shouldn't rely on jscrollpane.
            $("#popupContentWrapper").css("padding-top", "0px");

            $("#popupContent").css("border-top-right-radius", "5px")
                              .css("border-top-left-radius", "5px")
                              .css("border-top", "2px solid #CCC")
                              .css("border-right", "2px solid #CCC")
                              .css("border-left", "2px solid #CCC");
        };

        this.toggleVisible = function (e, clicked) {
            var clickedDiv = $(clicked);
            if (clickedDiv === null) {
                console.log("ERROR: No element clicked!");
                return;
            }

            var popupWrapperDiv = $("#popupWrapper");
            if (popupWrapperDiv.length === 0) {
                //console.log("Popup not initialized; initializing.");
                popupWrapperDiv = this.createPopup();
                if (popupWrapperDiv.length === 0) {
                    console.log("ERROR: Failed to create Popup!");
                    return;
                }
            }

            //TODO: Possibly change this to a data-* field.
            var id = clickedDiv.attr("id");
            //TODO: Fix repetition.
            if ($("#popup").is(":visible") && lastElementClick !== null) {
                if (clickedDiv.is("#" + lastElementClick)) {
                    console.log("Clicked on same element!");
                    console.log("Last clicked: " + lastElementClick);
                    this.closePopup();
                    //lastElementClick = clickedDiv.attr("id");
                    return;
                }
                console.log("Clicked on different element!");
                this.closePopup();
            }

            //Blocking statement that waits until popup closing animation is complete.
            $("#popup").promise().done(function () {});

            if(isLocked)return;

            this.updateLeftPosition(clickedDiv);

            var top = clickedDiv.outerHeight() + clickedDiv.offset().top - $(window).scrollTop() + (-1 * parseInt($("#popupArrow").css("margin-top"), 10)); //popupArrow is offset over the border, so this gives easier measurements.
            popupWrapperDiv.css("padding-top", top + "px");

            this.populate(id);

            clickedDiv.trigger("popupEvent", clickedDiv);

            if(backgroundColor!==null){
                $("#popupHeader").css("backgroundColor", backgroundColor);
                $("#popupContent").css("backgroundColor", backgroundColor);
            }

            if(fontColor!==null){
                $("#popup").css("color", fontColor);
                //TODO: OPTIONSPOPUP REFACTOR: Possibly push this into new optionsPopup.
                $("#popup a").css("color", fontColor);
            }

            if(borderColor!==null){
                $("#popupHeader").css("border-color", borderColor);
                $("#popupContent").css("border-color", borderColor);
                $(".popupContentRow").css("border-color", borderColor);
            }

            $("#popup").stop(false, true).fadeIn('fast');
            $("#popupWrapper").css("visibility", "visible");
            //TODO: Change namespace.
            popupWrapperDiv.trigger("popup.visible");
            lastElementClick = clickedDiv.attr("id");
        };

        //Function returns the left offset of the popup and target element.
        this.getLeft = function (target, popupDiv) {
            currentTarget = target;
            var targetOffset = target.offset().left + target.outerWidth() / 2;
            var rightOffset = targetOffset + popupDiv.outerWidth() / 2;
            var offset = targetOffset - popupDiv.outerWidth() / 2 + padding + 1; //TODO: Figure out where the 1 extra pixel is.. could just be rounding.
            var windowWidth = $(window).width();

            offScreen = false;
            if (offset < 0) {
                offScreen = true;
                offset = padding;
            } else if (rightOffset > windowWidth) {
                offScreen = true;
                offset = windowWidth - popupDiv.outerWidth();
            }

            //Returns left offset of popup from window.
            return {targetOffset: targetOffset, offset: offset};
        };

        this.setCaretPosition = function(targetOffset, outerOffset){
            var caretPos = "50%";
            var caret = $("#popupArrow");
            if (offScreen) {
                caretPos = (targetOffset - outerOffset + padding);
            }
            //Moves carrot on popup div.
            caret.css("left", caretPos);
        };

        this.updateLeftPosition = function(target){
            var popupWrapperDiv = $("#popupWrapper");
            var offset = thisPopup.getLeft(target, popupWrapperDiv);
            popupWrapperDiv.css("left", offset.offset);
            this.setCaretPosition(offset.targetOffset, offset.offset);
        };

        // createPopup: Prepends popup to dom
        this.createPopup = function () {
            //Creates popup div that will be populated in the future.
            var popupWrapperDiv = $(document.createElement("div"));
            popupWrapperDiv.attr("id", "popupWrapper");

            var s = "<div id='popup'>" +
                "<div id='popupArrow'></div>" +
                "<div id='currentPopupAction' style='display: none;'></div>" +
                "<div id='popupHeader'>" +
                "<div id='popupTitle'></div>" +
                "<a id='popupClose'></a>" +
                "</div>" +
                "<div id='popupContentWrapper'>" +
                "<div id='popupContent'></div>" +
                "</div>" +
                "</div>";
            popupWrapperDiv.html(s);
            popupWrapperDiv.find("#popup").css("display", "none");

            //Appends created div to page.
            $("body").prepend(popupWrapperDiv);

            //Click listener for popup close button.
            $("#popupClose").click(function () {
                thisPopup.closePopup();
                //$("#popupWrapper").css("visibility", "hidden");
            });

            //Window resize listener to check if popup is off screen.
            $(window).on('resize', function () {
                    var popupWrapperDiv = $("#popupWrapper");
                    if ($("#popup").is(":visible")) {
                        thisPopup.updateLeftPosition(currentTarget);
                        var top = $(currentTarget).outerHeight() + $(currentTarget).offset().top - $(window).scrollTop() + (-1 * parseInt($("#popupArrow").css("margin-top"), 10)); //popupArrow is offset over the border, so this gives easier measurements.
                        popupWrapperDiv.css("padding-top", top + "px");
                    }
                }
            );

            //Click listener to detect clicks outside of popup
            $('html')
                .on('click touchend', function (e) {
                    var clicked = $(e.target);
                    //TODO: Return if not visible.
                    var popupHeaderLen = clicked.parents("#popupHeader").length + clicked.is("#popupHeader") ? 1 : 0;
                    //TODO: Find better listener for this.
                    var popupContentLen = (clicked.parents("#popupContentWrapper").length && !clicked.parent().is("#popupContentWrapper")) ? 1 : 0;
                    var isListener = clicked.parents(".popupListener").length + clicked.is(".popupListener") ? 1 : 0;
                    if (popupHeaderLen === 0 && popupContentLen === 0 && isListener === 0) {
                        thisPopup.closePopup();
                    }
                }
            );

            var popupContentWrapperDiv = $("#popupContentWrapper");
            var throttleTimeout;
            $(window).bind('resize', function () {
                if ($.browser.msie) {
                    if (!throttleTimeout) {
                        throttleTimeout = setTimeout(function () {
                                popupContentWrapperDiv.trigger("popup.resize");
                                throttleTimeout = null;
                            }, 50
                        );
                    }
                } else {
                    popupContentWrapperDiv.trigger("popup.resize");
                }
            });

            //TODO: Is this the safest way?
            popupContentWrapperDiv.trigger("popup.created");

            //Function also returns the popup div for ease of use.
            return popupWrapperDiv;
        };

        //Closes the popup
        this.closePopup = function () {
            if(isLocked)return;
            lastElementClick = null;

            $(document).trigger("popup.closing");
            history = [];
            $("#popup").stop(false, true).fadeOut('fast');
            $("#popupWrapper").css("visibility", "hidden");
        };

        this.getAction = function () {
            return $("#currentPopupAction").html();
        };

        this.setAction = function (id) {
            $("#currentPopupAction").html(id);
        };

        this.previousPopup = function(){
            history.pop();
            if (history.length <= 0) {
                thisPopup.closePopup();
                return;
            }
            thisPopup.setData(history[history.length - 1]);
        };

        //Public setter function for private var title and sets title of the html popup element.
        this.setTitle = function (t) {
            title = t;
            $("#popupTitle").html(title);
        };

        //Public setter function for private var content and sets content of the html popup element.
        this.setContent = function (cont) {
            content = cont;
            //popupContentDiv.data('jsp').getContentPane().find("#popupContent").html(content);
            //TODO: Is setting the content w/o using the jScrollPane api safe to do?
            $("#popupContent").html(content);
            //TODO: Change event namespace.
            $("#popupContentWrapper").trigger("popup.setContent", $(this));
        };

        // Public getter function that returns a popup data object.
        // Returns: Popup data object if found, null if not.
        // Identifiers in object:
        //      id: Same as html id used if static
        //      title: Display text for popup header
        //      contents: Array of objects, included identifiers below
        //          name: Display text for links
        this.getMenu = function (id) {
            //Searches for a popup data object by the id passed, returns data object if found.
            var i;
            for (i = 0; i < menus.length; i += 1) {
                if (menus[i].id === id) {
                    return menus[i];
                }
            }

            //Null result returned if popup data object is not found.
            //console.log("No data found, returning null.");
            return null;
        };

        this.addMenu = function (id, title, contents) {
            menus.push({'id': id, 'title': title, 'contents': contents});
        };

        //Public void function that populates setTitle and setContent with data found by id passed.
        this.populate = function (id) {
            var newMenu = this.getMenu(id);
            if (newMenu === null) {
                //TODO: Possibly add a boolean to pass to indicate link or end of menu action.
                //console.log("ID not found.");
                return false;
            }
            $(document).trigger('popup.populating');
            history.push(newMenu);
            this.setData(newMenu);
            return true;
        };

        this.setData = function (data) {
            this.setAction(data.id);
            this.setTitle(data.title);
            this.setContent(data.contents);
        }
    }

    function OptionsPopup(popupListener){
        Popup.apply(this, [popupListener]);
        //this.prototype = new Popup(popupListener);
        //Popup.call(this, popupListener);
        var thisOptionsPopup = this;

        var isBackEnabled = true;

        $(document)
            .on('touchstart mousedown', '#popup a',
            function () {
                $(this).css({backgroundColor: "#488FCD"});
            })
            .on('touchend mouseup mouseout', '#popup a',
            function () {
                $(this).css({backgroundColor: ""});
            })
            .on('click', '.popupContentRow',
            function () {
                var newId = $(this).attr('id');

                //TODO: Prefix all events triggered
                if ($(this).hasClass("popupEvent")) {
                    $(this).trigger("popupEvent", $(this));
                }

                var keepOpen = thisOptionsPopup.populate(newId);
                if (!keepOpen) thisOptionsPopup.closePopup();
            })
            .on('popup.created', function(){
                createBackButton();
            })
        ;

        var createBackButton = function(){
            //Don't create back button or listener if disabled.
            if(!isBackEnabled)return;
            console.log("Creating back button.");
            $("#popupHeader").prepend("<a id='popupBack'></a>");
            $("#popupBack").click(function () {
                thisOptionsPopup.previousPopup();
            });
        };

        this.disableBackButton = function(){
            isBackEnabled = false;
        };

        this.setData = function (data) {
            var contArray = data.contents;
            var c = "";
            var i;
            //popupContentDiv.html('');
            for (i = 0; i < contArray.length; i++) {
                var lastElement = "";
                var popupEvent = "";
                var menuId = "";
                var menuUrl = "";
                if (i === contArray.length - 1) {
                    lastElement = " last";
                }

                //Links are given the popupEvent class if no url passed. If link has popupEvent,
                // event is fired based on currentPopupAction.
                if (typeof(contArray[i].id) !== 'undefined') {
                    menuId = " id='" + contArray[i].id + "'";
                }

                if (typeof(contArray[i].url) !== 'undefined') {
                    menuUrl = " href='" + contArray[i].url + "'";
                } else {
                    popupEvent = " popupEvent";
                }

                c += "<a" + menuUrl + menuId + " class='popupContentRow" + popupEvent + lastElement + "'>" +
                    contArray[i].name +
                    "</a>";
            }
            this.setAction(data.id);
            this.setTitle(data.title);
            this.setContent(c);
        };
    }

    return Popup;
});