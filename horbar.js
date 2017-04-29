(function($) {

    function processLabels (labels) {
        var res = [];
        for (var i = 0, len = labels.length; i < len; i++) {
            res.push(
                $('<div>').addClass('y-label').html(labels[i])
            );
        }
        return res;
    }

    function processData (labels, data) {

        // Calculate total reference
        var largestDataSetIndex = -1;
        var largestSum = -1;
        for (var i = 0, leni = data.dataSets.length; i < leni; i++) {
            var sum = data.dataSets[i].reduce(function (a, b) { return a + b; });
            if (sum > largestSum) {
                largestSum = sum;
                largestDataSetIndex = i;
            }
        }

        var res = [];
        for (var i = 0, leni = data.dataSets.length; i < leni; i++) {

            var sum = data.dataSets[i].reduce(function (a, b) { return a + b; });
            var width = (sum / largestSum) * 100;

            var $bar = $('<div>').addClass('bar').css('width', width + '%');

            for (var j = 0, lenj = data.dataSets[i].length; j < lenj; j++) {

                var segmentWidth = (data.dataSets[i][j] / sum) * 100;

                var $segment = $('<div>').addClass('bar-segment').css({
                  'background-color': ("#"+((1<<24)*Math.random()|0).toString(16)),
                  'width': segmentWidth + '%'
                }).data({
                    'segment': data.segments[j],
                    'data': data.dataSets[i][j]
                }).bind('click', function () {
                    alert($(this).data('segment'));
                });

                $bar.append($segment);
            }

            res.push(
                $bar
            );
        }

        return res;
    }

    function dispatch (obj, options) {
        obj.addClass(options.namespace);

        obj.append(
            $('<div>').addClass('y-labels').append(
                processLabels(options.labels)
            ),

            $('<div>').addClass('content').append(
                processData(options.labels, options.data)
            ),

            $('<div>').addClass('x-labels').append(
                $('<div>').addClass('x-label-refill').text('1'),
                $('<div>').addClass('x-label-container').text('asdf')
            )
        );
    }

    $.fn.horbar = function(options) {

        var opts = $.extend({}, $.fn.horbar.defaults, options);

        return this.each(function () {
            var $that = $(this);

            dispatch($that, opts);
        });
    };

    $.fn.horbar.defaults = {
        namespace: 'horbar',
        labels: ["Python", "PHP", "C"],
        data: {
          'positioning': 'perBar',
          'segments': ['Fans', 'Apps', 'Packages'],
          'dataSets': [
              [1, 5, 11],
              [2, 20, 0],
              [3, 1, 2]
              //{'name': "Packages", 'data': [11, 0, 2]}
          ]
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

})(jQuery);
