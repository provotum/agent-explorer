# Agent Explorer

## Basic architecture

Agent Explorer is provides a quick and easy UI framwork to get started building and testing features in Veramo. If you have an idea to build someting you can create a Widget for it and pin it to your dashboard for ease of access. As we use it internally for building new features, POCs and demos we designed it to be as flexible as possible with the most common use cases surfaced.

### Pages

Pages use templates, currently single and double column. These templates are responsive.

## Components

There are 2 types of components. **Standard components** that we all know and love. Functional, can fetch data if needed or not and we have **Widgets** which are React Lazy components. This components can be loaded at runtime and their configuration are saved locally to your browser. This is ideal for developing features in Veramo.
