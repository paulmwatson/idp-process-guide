
let apiUrl = '';

/* category */
let categoryLinkClone = null;
let categoryLinkWrapper = null;

const categoryContentClass = '.w-tab-pane';
const categoryLinkClass = '.tab-link';

const activeLinkClassName = 'w--current';

let categoryContentClone = null;
let categoryContentWrapper = null;

let emptyCategoryClone = null;
/* category */

/* engagement */
let engagementClone = null;
let engagementRowClone = null;

const engagementClass = '.engagement-block';
const engagementRowClass = '.engagement-block__details_row';
/* engagement */

let allEngagements = null;
let allCategories = null;

export class Engagements {
    constructor(baseUrl, hostname) {
        apiUrl = `${baseUrl}/events?hostname=${hostname}`;

        //tab-link
        this.setDomElements();
        this.getEngagements();
        this.setFiltering();
    }

    setDomElements = () => {
        categoryLinkWrapper = $('.tabs-menu');
        categoryContentWrapper = $('.tabs-content');

        categoryLinkClone = $(categoryLinkClass)[0].cloneNode(true);
        categoryContentClone = $(categoryContentClass)[0].cloneNode(true);

        engagementClone = $(engagementClass)[0].cloneNode(true);
        engagementRowClone = $(engagementRowClass)[0].cloneNode(true);

        emptyCategoryClone = $('.tab-pane__empty')[0].cloneNode(true);

        $(categoryLinkWrapper).empty();
        $(categoryContentWrapper).empty();
    }

    getEngagements = () => {
        fetch(apiUrl)
            .then(data => data.json())
            .then(data => {
                allEngagements = data;
                this.showCategories(data);
            })
    }

    showCategories = (engagements) => {
        let categories = this.getCategoriesFromEngagements(engagements);
        allCategories = categories;
        this.filterEngagements(90);
    }

    getCategoriesFromEngagements = (engagements) => {
        let categories = [{
            'id': 0,
            'name': 'All',
            'icon': 'fa fa-list-ul'
        }];
        engagements.forEach(e => {
            categories.push(e.category);
        });

        categories = categories.reduce(function (memo, e1) {
            let matches = memo.filter(function (e2) {
                return e1.id == e2.id && e1.id == e2.id
            })
            if (matches.length == 0)
                memo.push(e1)
            return memo;
        }, []);

        return categories;
    }

    createCategoryLinkAndContent = (categories, engagements) => {
        let self = this;
        $(categoryLinkWrapper).empty();
        $(categoryContentWrapper).empty();
        categories.forEach(c => {
            self.createCategoryLink(c);
            self.createCategoryContent(c, engagements);
        })
        this.setActiveCategory(0);  //all
    }

    createCategoryLink = (c) => {
        let item = categoryLinkClone.cloneNode(true);
        $(item).attr('id', 'c-link-' + c.id);
        $(item).removeClass(activeLinkClassName);
        $(item).removeAttr('data-w-tab');
        $(item).find('.loading').addClass('hidden');
        $(item).on('click', () => this.setActiveCategory(c.id));

        $('.tab-link__text', item).text(c.name);
        $('.tab-link__icon div', item).attr('class', c.icon);

        categoryLinkWrapper.append(item);
    }

    createCategoryContent = (c, engagements) => {
        let item = categoryContentClone.cloneNode(true);
        this.setCategoryContentProperties(item, c);
        this.setCategoryContentData(item, c, engagements);

        categoryContentWrapper.append(item);
    }

    setCategoryContentProperties = (item, c) => {
        $(item).attr('id', 'c-tab-' + c.id);
        $(item).attr('aria-labelledby', 'c-tab-' + c.id);
        $(item).removeClass('w--tab-active');
        $(item).removeAttr('data-w-tab');

        $(item).empty();
    }

    setCategoryContentData = (wrapper, c, engagements) => {
        let self = this;
        let data = engagements;
        if (c.id > 0) {
            //else : All engagements
            data = engagements.filter((e) => {
                return e.category.id === c.id
            })
        }

        //data is filtered
        if (data !== null && data.length > 0) {
            data.forEach((e) => {
                let item = engagementClone.cloneNode(true);
                $('.engagement-block__header .engagement-block__icon div', item).attr('class', e.category.icon);
                $('.engagement-block__header .engagement-block__title', item).text(e.title);

                $('.engagement-block__details', item).html('');
                self.appendRowToEngagementBlock(item, 'fa fa-info', e.short_desc, null, false);

                const dateText = getDateText(e);
                self.appendRowToEngagementBlock(item, 'fa fa-calendar', dateText, null, false);
                e.actions.forEach((a) => {
                    self.appendRowToEngagementBlock(item, a.icon, a.description_html, a.confirmed_date, true);
                })

                $(wrapper).append(item);
            })
        } else {
            //no data for the category
            let item = emptyCategoryClone.cloneNode(true);
            $(wrapper).append(item);
        }
    }

    appendRowToEngagementBlock = (item, iconClass, text, rowDate, isActionRow = false) => {
        let row = engagementRowClone.cloneNode(true);
        $('.engagement-block__details_icon div', row).attr('class', iconClass);
        if (isActionRow) {

            if (rowDate !== null && rowDate !== '') {
                let h5 = $('<h5></h5>');
                $(h5).text(rowDate);
                $('.engagement-block__rich-text', row).append(h5);
            }
            let div = $('<div></div>');
            $(div).html(text);
            $('.engagement-block__rich-text', row).append(div);
        } else {
            $('.engagement-block__rich-text', row).text(text);
        }
        $('.engagement-block__details', item).append(row);
    }

    setActiveCategory = (id) => {
        $(categoryContentClass).each(function () {
            $(this).addClass('hidden');
            if ($(this).attr('id') === 'c-tab-' + id) {
                $(this).removeClass('hidden');
            }
        });

        $(categoryLinkClass).each(function () {
            $(this).removeClass(activeLinkClassName);
            if ($(this).attr('id') === 'c-link-' + id) {
                $(this).addClass(activeLinkClassName);
            }
        });
    }

    setFiltering = () => {
        let self = this;
        $('a.events-range__row').each(function () {
            $(this).on('click', () => {
                $('.events-range__selector div:nth-child(2)').text($(this).find('div').text());
                $('.events-range__selector').removeClass('w--open');
                $('.events-range__list').removeClass('w--open');
                $('.events-range__selector').attr('aria-expanded', false);
                let filterDays = $(this).attr('data-filterDays');
                self.filterEngagements(filterDays);
            })
        });
    }

    filterEngagements = (filterDayCount) => {
        //filter engagements from allEngagements
        //call createCategoryLinkAndContent -> categories = allCategories, engagements = filteredEngagements
        let filterDate = new Date(new Date().getTime() + (filterDayCount * 24 * 60 * 60 * 1000));
        let engagements = allEngagements.filter((e) => {
            return (new Date(e.end_date) <= filterDate)
        });
        this.createCategoryLinkAndContent(allCategories, engagements);
    }
}

export function getDateText(e) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let result = '';

    const end = new Date(e.end_date);

    if (e.start_date === null) {
        //no start date --- "By 25 January 2020"
        let date_str = 'By ' + end.getDate() + ' ' + monthNames[end.getMonth()] + ' ' + end.getFullYear();
        result = date_str;
    } else {
        //has start date
        const start = new Date(e.start_date);
        let date_str = '';


        if (start.getFullYear() === end.getFullYear()) {
            if (start.getMonth() === end.getMonth()) {
                //same month same year --- "1 - 30 September 2020"
                date_str = start.getDate() + ' - ' + end.getDate() + ' ' + monthNames[end.getMonth()] + ' ' + end.getFullYear();
            } else {
                //different months --- "1 August - 25 September 2020"
                date_str = start.getDate() + ' ' + monthNames[start.getMonth()] + ' - ' + end.getDate() + ' ' + monthNames[end.getMonth()] + ' ' + end.getFullYear();
            }
        } else {
            //seperate year --- "1 September 2020 - 30 September 2021"
            date_str = start.getDate() + ' ' + monthNames[start.getMonth()] + ' ' + start.getFullYear() + ' - ' + end.getDate() + ' ' + monthNames[end.getMonth()] + ' ' + end.getFullYear();
        }


        result = date_str;
    }

    return result;
}
