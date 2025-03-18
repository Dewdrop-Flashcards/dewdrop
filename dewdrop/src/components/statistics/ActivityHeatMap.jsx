import React, { useMemo } from 'react';

const ActivityHeatMap = ({ activityData, timeFrame }) => {
    // Get the date range for the heat map based on timeFrame
    const dateRange = useMemo(() => {
        const endDate = new Date();
        const startDate = new Date();

        // Calculate the start date based on timeFrame
        switch (timeFrame) {
            case 'week':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(endDate.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
            default:
                startDate.setFullYear(endDate.getFullYear() - 1);
        }

        return { startDate, endDate };
    }, [timeFrame]);

    // Generate array of days between start and end dates
    const days = useMemo(() => {
        const { startDate, endDate } = dateRange;
        const daysArray = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            daysArray.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return daysArray;
    }, [dateRange]);

    // Create a map of activity counts by date string
    const activityByDate = useMemo(() => {
        const map = {};
        activityData.forEach(item => {
            map[item.date] = item.count;
        });
        return map;
    }, [activityData]);

    // Calculate the maximum activity count for color scaling
    const maxCount = useMemo(() => {
        if (activityData.length === 0) return 0;
        return Math.max(...activityData.map(item => item.count));
    }, [activityData]);

    // Group days by week for grid layout
    const weeks = useMemo(() => {
        if (days.length === 0) return [];

        // Sort days chronologically first
        const sortedDays = [...days].sort((a, b) => a.getTime() - b.getTime());

        // Group days into chronological weeks
        // First, find the first Sunday to start a complete week
        let startIndex = 0;
        while (startIndex < sortedDays.length && sortedDays[startIndex].getDay() !== 0) {
            startIndex++;
        }

        if (startIndex >= sortedDays.length) {
            // No Sunday found, handle edge case
            return [Array(7).fill(null)];
        }

        // Create week columns (each representing 7 days starting on Sunday)
        const weekColumns = [];
        let currentWeek = Array(7).fill(null);

        // Fill in days before first Sunday
        if (startIndex > 0) {
            const partialWeek = Array(7).fill(null);
            for (let i = startIndex - 1; i >= 0; i--) {
                const day = sortedDays[i];
                partialWeek[day.getDay()] = day;
            }
            weekColumns.push(partialWeek);
        }

        // Process complete weeks
        for (let i = startIndex; i < sortedDays.length; i++) {
            const day = sortedDays[i];
            const dayOfWeek = day.getDay();

            // If it's a new week (Sunday), start a new column
            if (dayOfWeek === 0 && i > startIndex) {
                weekColumns.push(currentWeek);
                currentWeek = Array(7).fill(null);
            }

            currentWeek[dayOfWeek] = day;

            // Handle the last week
            if (i === sortedDays.length - 1) {
                weekColumns.push(currentWeek);
            }
        }

        // Now transpose the data so each row represents a day of the week
        const weeksData = Array(7).fill().map(() => []);

        weekColumns.forEach(week => {
            for (let i = 0; i < 7; i++) {
                weeksData[i].push(week[i]);
            }
        });

        return weeksData;
    }, [days]);

    // Get month labels for the top of the grid based on the weeks
    const monthLabels = useMemo(() => {
        if (weeks.length === 0 || weeks[0].length === 0) return [];

        // Each week column represents a week, and we need to display the months at the top
        const labels = [];
        let currentMonth = -1;
        let currentMonthStart = -1;

        // Loop through each week (column)
        for (let weekIdx = 0; weekIdx < weeks[0].length; weekIdx++) {
            // Find first non-null day in this week column to determine month
            let month = null;
            for (let dayIdx = 0; dayIdx < weeks.length && month === null; dayIdx++) {
                const day = weeks[dayIdx][weekIdx];
                if (day) {
                    month = day.getMonth();
                }
            }

            // If no days in this week, skip
            if (month === null) continue;

            // If this is a new month or the first month
            if (month !== currentMonth) {
                // If we already have a month in progress, close it
                if (currentMonth !== -1) {
                    labels.push({
                        month: currentMonth,
                        startColumn: currentMonthStart,
                        endColumn: weekIdx - 1
                    });
                }

                // Start new month
                currentMonth = month;
                currentMonthStart = weekIdx;
            }

            // Handle the last week
            if (weekIdx === weeks[0].length - 1) {
                labels.push({
                    month: currentMonth,
                    startColumn: currentMonthStart,
                    endColumn: weekIdx
                });
            }
        }

        return labels;
    }, [weeks]);

    // Get the day names for the left side of the grid
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Get color for a specific activity count
    const getColorForCount = (count) => {
        if (!count) return 'bg-gray-200'; // No activity

        // Calculate color intensity based on count relative to max
        const intensity = Math.min(Math.ceil((count / (maxCount || 1)) * 4), 4);

        // Return the appropriate TailwindCSS class based on intensity
        switch (intensity) {
            case 1: return 'bg-green-200';
            case 2: return 'bg-green-300';
            case 3: return 'bg-green-500';
            case 4: return 'bg-green-700';
            default: return 'bg-gray-200';
        }
    };

    // Format date as YYYY-MM-DD for lookup in activity data
    const formatDateString = (date) => {
        if (!date) return '';
        return date.toISOString().split('T')[0];
    };

    // Get the title for the heat map based on the time frame
    const getTitle = () => {
        switch (timeFrame) {
            case 'week':
                return 'Contributions in the last week';
            case 'month':
                return 'Contributions in the last month';
            case 'year':
                return 'Contributions in the last year';
            default:
                return 'Contributions';
        }
    };

    return (
        <div>
            <div className="text-lg font-semibold mb-2">
                {getTitle()}
            </div>

            <div className="relative">
                {/* Month labels at the top */}
                <div className="flex mb-2 pl-14">
                    {monthLabels.map((label, idx) => {
                        const monthName = new Date(new Date().getFullYear(), label.month, 1)
                            .toLocaleDateString('en-US', { month: 'short' });

                        // Calculate width based on number of week columns in this month
                        const width = (label.endColumn - label.startColumn + 1) * 17;
                        const marginLeft = idx === 0 ? 0 : 2;

                        return (
                            <div
                                key={`month-${idx}`}
                                className="text-xs text-gray-500"
                                style={{
                                    width: `${width}px`,
                                    marginLeft: `${marginLeft}px`,
                                    textAlign: 'left'
                                }}
                            >
                                {monthName}
                            </div>
                        );
                    })}
                </div>

                <div className="flex">
                    {/* Day of week labels */}
                    <div className="flex flex-col w-12 mr-2">
                        {dayNames.map((day, index) => (
                            <div
                                key={`day-${index}`}
                                className="text-xs text-gray-500 h-[15px] flex items-center justify-end pr-2"
                                style={{ marginBottom: '2px' }}
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Grid of activity cells */}
                    <div className="flex-1">
                        {weeks.map((weekRow, rowIndex) => (
                            <div key={`row-${rowIndex}`} className="flex h-[15px] mb-[2px]">
                                {weekRow.map((day, dayIndex) => {
                                    const dateStr = formatDateString(day);
                                    const count = activityByDate[dateStr] || 0;
                                    const colorClass = getColorForCount(count);

                                    return (
                                        <div
                                            key={`day-${dateStr}`}
                                            className={`w-[15px] h-[15px] mr-[2px] ${colorClass} rounded-sm group relative`}
                                            title={`${count} contributions on ${dateStr}`}
                                        >
                                            {/* Tooltip */}
                                            <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-xs rounded p-2 bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 shadow-lg whitespace-nowrap">
                                                {count} {count === 1 ? 'contribution' : 'contributions'} on {
                                                    new Date(dateStr).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })
                                                }
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end mt-2 text-xs text-gray-500">
                    <span className="mr-1">Less</span>
                    <div className="flex items-center space-x-1">
                        <div className="h-3 w-3 bg-gray-200 rounded-sm"></div>
                        <div className="h-3 w-3 bg-green-200 rounded-sm"></div>
                        <div className="h-3 w-3 bg-green-300 rounded-sm"></div>
                        <div className="h-3 w-3 bg-green-500 rounded-sm"></div>
                        <div className="h-3 w-3 bg-green-700 rounded-sm"></div>
                    </div>
                    <span className="ml-1">More</span>
                </div>
            </div>
        </div>
    );
};

export default ActivityHeatMap;
