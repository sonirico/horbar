(function($) {

    function Chart(target, config) {
        var self = this;

        self.init = function() {
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

            self.adjustLabels();
            self.buildLegends();

            // callBacks
            self.callBacks();
        };

        self.callBacks = function () {
            // X labels
            self.target.find('.x-label-content').each(function () {
                $(this).append(
                    config.options.xLabels.drawCallBack(
                        $(this).data().value
                    )
                );
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
                    'margin-left': '-' + ($label.width() / 2) + 'px'
                });
            });
        };

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

            // TODO: Encapsulate this logic
            var res = [];
            var delta = Math.round(self.threshold / self.tickLength);
            var nTicks = self.threshold / delta;
            var widthPerLabel = 100 / nTicks;
            var remainingWidthPercent = 100;

            for (var i = 0; i < nTicks; i++) {
                var realWidth = 0;

                if (remainingWidthPercent >= widthPerLabel) {
                    realWidth = widthPerLabel;
                } else {
                    realWidth = remainingWidthPercent;
                }

                if (realWidth < 1) {
                    break;
                }

                realWidth += '%'

                res.push(
                    $('<div>').addClass('vertical-grid').css({
                        'width': realWidth,
                        'max-width': realWidth,
                    })
                );

                remainingWidthPercent -= widthPerLabel;
            }

            $subContent.append(res);
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

        self.processXLabels = function() {

            var res = [];
            var delta = Math.round(self.threshold / self.tickLength);
            var nTicks = self.threshold / delta;
            var widthPerLabel = 100 / nTicks;
            var remainingWidthPercent = 100;

            for (var i = 0; i < nTicks; i++) {
                var realWidth = 0;

                if (remainingWidthPercent >= widthPerLabel) {
                    realWidth = widthPerLabel;
                } else {
                    realWidth = remainingWidthPercent;
                }

                if (realWidth < 1) {
                    break;
                }

                realWidth += '%'

                res.push(
                    $('<div>').addClass('x-label').css({
                        'width': realWidth,
                        'max-width': realWidth
                    }).append(
                        $('<span>').addClass('x-label-content').data('value', delta * i)
                    )
                );

                remainingWidthPercent -= widthPerLabel;
            }

            self.target.find('.x-label-container').append(res);
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
            // HACK: Harcoded alpha. Parametrize
            var backgroundColor = 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0.6)';
            var borderColor = 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0.9)';

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

            // Segment callbacks
            config.options.segments.drawCallBack($segment);

            return $segment;
        }

        self.processContent = function () {
            var data = config.data;
            var labels = config.labels;
            var res = [];

            for (var i = 0, leni = data.dataSets.length; i < leni; i++) {

                var $row = $('<div>').addClass('bar-row');

                var sum = data.dataSets[i].reduce(function(a, b) {
                    return a + b;
                });

                var width = ((sum / self.threshold) * 100);

                var $barContainer = $('<div>').addClass('bar-container');
                var $bar = $('<div>').addClass('bar').css('width', width + '%').data('value', sum);

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

            // HACK .ne .se ... harcoded
            self.target.find('.content').append(
                $('<div>').addClass('legends ne').append(
                    legends
                )
            );
        };

        return self.init();
    };



    $.fn.horbar = function(options) {

        var opts = $.extend({}, $.fn.horbar.defaults, options);

        return this.each(function() {
            var $target = $(this);

            new Chart($target, opts);
        });
    };

    $.fn.horbar.defaults = {
        namespace: 'horbar',
        labels: ["Python", "PHP", "C"],
        data: {
            'positioning': 'perBar',
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
                [1, 5, 11],
                [2, 2, 0],
                [3, 1, 2],
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
                /*style: {

                },
                position: "ne"*/
            },
            segments: {
                drawCallBack: function (segment) {
                    defaultSegmentCallBack(segment);
                },
                events: {
                    mouseenter: function(segment) {
                        showPopover(segment);
                        // console.log(segment.data().name + ' -> ' + segment.data().value);
                    },
                    mouseleave: function(segment) {
                        removePopover(segment);
                        // console.log(segment.data().name + ' -> ' + segment.data().value);
                    },

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
        /*
          'positioning': 'perSegments',
          'segments': [],
          'dataSets': [
              {'name': "Fans", 'data': [1, 2, 3]},
              {'name': "Apps", 'data': [5, 20, 1]},
              //{'name': "Packages", 'data': [11, 0, 2]}
          ]
        */
    };

    function r() {
        return parseInt(Math.random() * 1000);
    }

    // Default built-in events and callbacks
    function defaultSegmentCallBack ($segment) {

      console.log($segment.width());
      var $span = $('<span/>').addClass('segment-value').html(
          $segment.data().value
      );

      console.log($span.width());

        $segment.append(
            $span
        );
        console.log($span.width());
setTimeout(function () {
        console.log($span.width());
      },0);
    }

    function showPopover(segment) {

        if (segment.data('haspopover') === true) {
            return;
        }

        // console.log(segment.data());

        var $popover = $('<div>').addClass('popover').append(
            $('<span>').text(segment.data().name),
            $('<span>').text(segment.data().value)
        ).appendTo('.horbar .content');

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
        // TODO: Watch out namespacing, harcoded ".horbar"
        segment.data('haspopover', false);

        $('.horbar .popover').remove();
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
