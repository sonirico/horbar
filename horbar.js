(function($) {

    function Chart(target, config) {
        var self = this;

        function init() {
            self.target = target;
            self.dataSets = config.dataSets;
            self.segments = config.segments;
            self.tickLength = config.options.tickLength || 10;
            self.threshold = config.threshold || self.getThreshold();


            self.update();

            return self;
        };

        self.reset = function() {
            self.target.empty();
            self.target.removeData();
            self.target.removeClass();
        };

        self.update = function() {
            self.reset();

            self.target.addClass(config.namespace);

            self.target.append(

                $('<div>').addClass('y-labels'),
                $('<div>').addClass('content'),
                $('<div>').addClass('x-labels').append(
                    $('<div>').addClass('x-label-refill').html('&nbsp;'),
                    $('<div>').addClass('x-label-container')
                )

            );

            // Creates vertical grid lines
            self.buildGrid();

            self.processYLabels();
            self.processContent();
            self.processXLabels();

            var runCallbacks = function () {
                var promise = new Promise(function (resolve, reject) {
                    setTimeout(function() {
                        // Segment callbacks

                        self.callBacks();
                        resolve();

                    }, 0);
                });

                return promise;
            };

            var runAdjustments = function () {
                var promise = new Promise(function (resolve, reject) {
                  setTimeout(function() {

                      self.adjustLabels();
                      self.buildLegends();
                      resolve();

                  }, 0);

                });

                return promise;
            };

            runCallbacks().then(runAdjustments());

        };

        self.callBacks = function() {
            // X labels
            self.target.find('.x-label-content').each(function() {
                $(this).append(
                    config.options.xLabels.drawCallBack(
                        $(this).data().value
                    )
                );
            });
            // segments
            self.target.find('.bar-segment').each(function() {
                config.options.segments.drawCallBack($(this))
            });
        };

        self.adjustLabels = function() {

            // Y labels
            var $sampleBar = self.target.find('.bar-row').first();
            if ($sampleBar.length > 0) {
                var height = $sampleBar.height();

                self.target.find('.y-label').css({
                    'height': height + 'px',
                    'line-height': height + 'px'
                });
            }

            // X labels

            self.target.find('.x-label-content').each(function() {
                var $label = $(this);

                $label.css({
                    'margin-right': '-' + ($label.width() / 2) + 'px'
                });
            });
        };

        function buildLabelSchema() {
            var widths = [];

            var delta = resolveDelta();
            var nTicks = self.threshold / delta;
            var widthPerLabel = 100 / nTicks;
            var remainingWidthPercent = 100;

            for (var i = 0; i < nTicks; i++) {
                var realWidth = 0;

                if (remainingWidthPercent >= widthPerLabel) {
                    realWidth = widthPerLabel;
                } else {
                    break;
                }

                if (realWidth < 1) {
                    break;
                }

                widths.push(realWidth);

                remainingWidthPercent -= widthPerLabel;
            }

            return {
                'delta': delta,
                'widths': widths
            }
        }

        self.buildGrid = function() {

            var $content = self.target.find('.content');
            var $subContent = $('<div>').css({
                'position': 'absolute',
                'top': '0%',
                'bottom': '0%',
                'left': '0%',
                'right': '0%',
                'opacity': '0.5'
            });

            var labelSchema = buildLabelSchema();

            labelSchema.widths.forEach(function(width) {
                $subContent.append(
                    $('<div>').addClass('vertical-grid').css({
                        'width': width + '%',
                        'max-width': width + '%',
                    })
                );
            });

            $content.append($subContent);
        };

        self.getThreshold = function() {
            if (undefined === self.threshold || !self.threshold) {
                var largestSum = Math.max.apply(
                    Math, config.data.dataSets.map(function(b) {
                        return b.reduce(function(x, y) {
                            return x + y;
                        })
                    })
                );

                return (self.threshold = largestSum);
            } else {
                return self.threshold;
            }
        };

        function resolveDelta() {
            var delta = -1;

            if (self.threshold < 10) {
                delta = 1;
            } else {
                var magnitudeLength = self.threshold.toString().length - 1;
                var magnitude = Math.pow(10, magnitudeLength);
                var correctedThreshold = Math.ceil(self.threshold / magnitude) * magnitude;

                delta = correctedThreshold / self.tickLength;
            }

            return delta;
        };

        self.processXLabels = function() {
            var $labelContainer = self.target.find('.x-label-container');
            var labelSchema = buildLabelSchema();

            // Add x-axis labels to chart
            labelSchema.widths.forEach(function(width, index) {
                $labelContainer.append(
                    $('<div>').addClass('x-label').css({
                        'width': width + '%',
                        'max-width': width + '%'
                    }).append(
                        $('<span>')
                        .addClass('x-label-content')
                        .data('value', labelSchema.delta * (index + 1))
                    )
                );
            });

            // Use the refill as the zero container
            self.target.find('.x-label-refill').html(0);
        };

        self.processYLabels = function() {
            var res = [];

            config.labels.forEach(function(label) {
                res.push(
                    $('<div>').addClass('y-label').append(
                        $('<span>').addClass('label-text')
                        .attr('title', label)
                        .html(
                            config.options.yLabels.drawCallBack(label)
                        )
                    )
                );
            });

            self.target.find('.y-labels').append(res);
        }

        self.buildSegment = function(width, hexColor, data) {
            var rgb = hexToRgb(hexColor);
            var borderAlpha = config.options.segments.style.borderAlpha;
            var backgroundAlpha = config.options.segments.style.backgroundAlpha;

            var backgroundColor = 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + backgroundAlpha + ')';
            var borderColor = 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + borderAlpha + ')';

            var $segment = $('<div>').addClass('bar-segment').css({
                'color': borderColor,
                'background-color': backgroundColor,
                'width': width + '%'
            }).data(data);

            // Bind events to segments
            var eventsConfig = config.options.segments.events;

            Object.keys(eventsConfig).forEach(function(eventName) {
                $segment.bind(eventName, function(e) {

                    var funcCallback = eventsConfig[eventName];
                    funcCallback($(this));

                });
            });

            return $segment;
        }

        self.processContent = function() {
            var data = config.data;
            var labels = config.labels;
            var res = [];

            for (var i = 0, leni = data.dataSets.length; i < leni; i++) {

                var $row = $('<div/>').addClass('bar-row');

                var sum = data.dataSets[i].reduce(function(a, b) {
                    return a + b;
                });

                var width = ((sum / self.threshold) * 100);

                var $barContainer = $('<div/>').addClass('bar-container');
                var $bar = $('<div/>')
                  .addClass('bar')
                  .css('width', width + '%')
                  .data('value', sum);

                for (var j = 0, lenj = data.dataSets[i].length; j < lenj; j++) {
                    if (data.dataSets[i][j] < 1) {
                        continue;
                    }

                    var segmentWidth = (data.dataSets[i][j] / sum) * 100;

                    var $segment = self.buildSegment(segmentWidth, data.segments[j].color, {
                        'name': data.segments[j].name,
                        'value': data.dataSets[i][j]
                    });

                    $bar.append($segment);
                }

                res.push($row.append($barContainer.append($bar)));
            }

            self.target.find('.content').append(res);
        }

        self.buildLegends = function() {
            var legends = [];
            config.data.segments.forEach(function(s) {
                legends.push(
                    $('<div>').addClass('legend').text(s.name).append(
                        $('<div>').addClass('legend-color').css('background-color', s.color)
                    )
                );
            });

            var legendPositionClass = config.options.legend.position;

            self.target.find('.content').append(
                $('<div>')
                    .addClass('legends ' + legendPositionClass)
                    .append(legends)
            );
        };

        self.nativeObject = function() {
            return self.target;
        }

        return init();
    };

    $.fn.horbar = function(options) {

        var opts = $.extend({}, $.fn.horbar.defaults, options);
        var chartObjects = [];

        this.each(function() {
            var $target = $(this);

            chartObjects.push(new Chart($target, opts));
        });

        return chartObjects.length === 1 ? chartObjects[0] : chartObjects;
    };

    $.fn.horbar.defaults = {
        namespace: 'horbar',
        labels: ["Python", "PHP", "C"],
        data: {
            'segments': [{
                    'name': 'Fans',
                    'color': '#FF0000'
                },
                {
                    'name': 'Apps',
                    'color': '#00FF00'
                },
                {
                    'name': 'Packages',
                    'color': '#0000FF'
                }
            ],
            'dataSets': [
                // [1, 5, 11],
                // [2, 2, 0],
                // [3, 1, 2],
                [r(), r(), r()],
                [r(), r(), r()],
                [r(), r(), r()],
                [r(), r(), r()],
                [r(), r(), r()],
                [r(), r(), r()],
                [r(), r(), r()],
                [r(), r(), r()],
                [r(), r(), r()],
                [r(), r(), r()],
                [r(), r(), r()],
                [r(), r(), r()],
                [r(), r(), r()]
                // [2],
                // [5],
                // [10]
            ]
        },
        options: {
            legend: {
                position: "se"
            },
            segments: {
                drawCallBack: function(segment) {
                    defaultSegmentCallBack(segment);
                },
                events: {
                    mouseenter: function(segment) {
                        showPopover(segment);
                    },
                    mouseleave: function(segment) {
                        removePopover(segment);
                    },

                },
                style: {
                    borderAlpha: 0.9,
                    backgroundAlpha: 0.6
                }
            },
            yLabels: {
                drawCallBack: function(v) {
                    return v;
                },
                events: {}
            },
            xLabels: {
                drawCallBack: function(v) {
                    return v;
                },
                events: {}
            },
            tickLength: 10
        }
    };

    function r() {
        return parseInt(Math.random() * 20);
    }

    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }

    // Default built-in events and callbacks
    function defaultSegmentCallBack($segment) {

        // console.log($segment.width());
        var $span = $('<span/>').addClass('segment-value').html(
            $segment.data().value
        ).appendTo($segment);

        var segment = $segment[0];
        var offsetWidth = segment.offsetWidth;
        var scrollWidth = segment.scrollWidth;

        if (offsetWidth < scrollWidth) {
            $segment.children().hide();
        }
    }

    function showPopover(segment) {

        if (segment.data('haspopover') === true) {
            return;
        }

        var popoverId = 'horbar-popover';

        var $popover = $('<div>').attr('id', popoverId).append(
            $('<span>').text(segment.data().name),
            $('<span>').text(segment.data().value)
        ).appendTo('body');

        var barTop = segment.offset().top;
        var barLeft = segment.offset().left;
        var barWidth = segment.width();
        var barHeight = segment.height();
        var popoverTopMargin = 10;
        var popoverWidth = $popover.width();

        $popover.css({
            'top': (barTop + barHeight + popoverTopMargin) + 'px',
            'left': (barLeft + (barWidth - popoverWidth) / 2) + 'px'
        });

        $popover.show();

        segment.data('haspopover', true);

    }

    function removePopover(segment) {

        segment.data('haspopover', false);

        $('#horbar-popover').remove();
    }

    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }


})(jQuery);
